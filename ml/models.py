import tensorflow as tf
from tensorflow.keras import layers, Model
import numpy as np


def createAndTrainAutoencoder(
    trainingData,
    validationData,
    encodingDimension,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metric='mae',
    validationSteps=3,
    testingData=None,
):
    inputDimension = len(trainingData[0])

    inputData = layers.Input(shape=(inputDimension,))
    encoded = layers.Dense(encodingDimension)(inputData)
    decoded = layers.Dense(inputDimension)(encoded)

    autoencoder = Model(inputData, decoded)
    encodedInput = layers.Input(shape=(encodingDimension,))
    decoderLayer = autoencoder.layers[-1]
    encoder = Model(inputData, encoded)
    decoder = Model(encodedInput, decoderLayer(encodedInput))

    autoencoder.compile(
        optimizer=tf.keras.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=[metric],
    )
    autoencoder.fit(
        trainingData,
        trainingData,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
        validation_data=(validationData, validationData),
        validation_steps=validationSteps,
    )
    return autoencoder, encoder, decoder


def createAndTrainLstmAutoencoder(
    trainingData,
    validationData,
    sequenceLength,
    featureCount,
    encodingDimension,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metric='mae',
    validationSteps=3,
):
    inputData = layers.Input(shape=(sequenceLength, featureCount))
    encoded = layers.LSTM(
        encodingDimension,
        activation='relu',
        return_sequences=False,
    )(inputData)
    x = layers.RepeatVector(
        sequenceLength,
        name='repeat-layer',
    )(encoded)
    x = layers.LSTM(
        encodingDimension,
        activation='relu',
        return_sequences=True,
    )(x)
    decoded = layers.TimeDistributed(layers.Dense(featureCount))(x)

    autoencoder = Model(inputData, decoded)
    encodedInput = layers.Input(shape=(encodingDimension,))
    decoderLayer = autoencoder.get_layer('repeat-layer')
    encoder = Model(inputData, encoded)
    decoder = Model(encodedInput, decoderLayer(encodedInput))

    autoencoder.compile(
        optimizer=tf.keras.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=[metric]
    )
    autoencoder.fit(
        trainingData,
        trainingData,
        batch_size=batchSize,
        epochs=epochs,
        validation_data=(validationData, validationData),
        validation_steps=validationSteps,
        shuffle=True,
    )
    return autoencoder, encoder, decoder


def denoisingAutoencodedLayer(
    trainingData,
    validationData,
    encodingDimension,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    validationSteps=3,
    testingData=None,
):
    inputDimension = len(trainingData[0])

    inputData = layers.Input(shape=(inputDimension,))
    encoded = layers.Dense(encodingDimension, name='trained-layer')(inputData)
    decoded = layers.Dense(inputDimension)(encoded)

    noise = np.random.normal(loc=0.5, scale=0.5, size=trainingData.shape)
    trainingDataNoisey = trainingData + noise
    noise = np.random.normal(loc=0.5, scale=0.5, size=validationData.shape)
    validationDataNoisey = validationData + noise

    trainingDataNoisey = np.clip(trainingDataNoisey, 0., 1.)
    validationDataNoisey = np.clip(validationDataNoisey, 0., 1.)

    autoencoder = Model(inputData, decoded)

    autoencoder.compile(
        optimizer=tf.keras.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=['mae']
    )
    autoencoder.fit(
        trainingDataNoisey,
        trainingData,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
        validation_data=(validationData, validationDataNoisey),
        validation_steps=validationSteps,
    )
    return autoencoder.get_layer('trained-layer')


def createAndTrainPerceptron(
    trainFeatures,
    trainLabels,
    perceptronDimension,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    testingData=None,
):
    inputDimension = len(trainFeatures[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    predictions = layers.Dense(
        1,
        activation='relu',
        name='perceptron-weights'
    )(inputs)

    perceptron = tf.keras.Model(inputs=inputs, outputs=predictions)

    perceptron.compile(
        optimizer=tf.optimizers.Nadam(learningRate),
        loss='mse',
        metrics=['mae'],
    )
    history = perceptron.fit(
        trainFeatures,
        trainLabels,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
    )
    return perceptron, history


def createAndTrainSimpleNet(
    trainFeatures,
    trainLabels,
    intermediateDimension,
    epochs=5000,
    learningRate=0.0002,
    lossFunction='mse',
    testingData=None,
):
    inputDimension = len(trainFeatures[0])
    outputDimension = len(trainLabels[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    x = layers.Dense(intermediateDimension)(inputs)
    x = layers.Dense(outputDimension)(x)

    model = tf.keras.Model(inputs=inputs, outputs=x)

    model.compile(
        optimizer=tf.optimizers.Nadam(learningRate),
        loss='mse',
        metrics=['mae'],
    )
    history = model.fit(
        trainFeatures,
        trainLabels,
        epochs=epochs,
        shuffle=True,
    )
    return model, history
