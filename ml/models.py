import tensorflow as tf
from tensorflow.keras import layers, Model


def createAndTrainAutoencoder(
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
        metrics=['mae']
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
