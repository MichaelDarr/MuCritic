import tensorflow as tf
from tensorflow.keras import layers, Model


def autoencode(
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
        optimizer=tf.keras.optimizers.Adam(learningRate),
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
