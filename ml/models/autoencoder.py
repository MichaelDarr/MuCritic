from tensorflow.keras import layers, optimizers, Model
import numpy as np


def autoencoder(
    trainingData,
    validationData,
    encodingDimension,
    activation='relu',
    batchSize=256,
    denoise=False,
    epochs=200,
    hiddenDimension=None,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    testingData=None,
    validationSteps=3,
):
    inputDimension = len(trainingData[0])
    inputData = layers.Input(shape=(inputDimension,))
    encoded = inputData
    if hiddenDimension is not None:
        encoded = layers.Dense(
            hiddenDimension,
            activation=activation
        )(encoded)
    encoded = layers.Dense(
        encodingDimension,
        activation=activation
    )(inputData)
    decoded = encoded
    if hiddenDimension is not None:
        decoded = layers.Dense(
            hiddenDimension,
            activation=activation
        )(decoded)
    decoded = layers.Dense(
        inputDimension,
        activation=activation
    )(decoded)

    autoencoder = Model(inputData, decoded)
    encodedInput = layers.Input(shape=(encodingDimension,))
    decoderLayer = (
        autoencoder.layers[-1](encodedInput) if hiddenDimension is None
        else autoencoder.layers[-1](autoencoder.layers[-2](encodedInput)))
    encoder = Model(inputData, encoded)
    decoder = Model(encodedInput, decoderLayer)

    trainingDataTargets = trainingData
    if denoise:
        noise = np.random.normal(loc=0.5, scale=0.5, size=trainingData.shape)
        trainingDataTargets = trainingData + noise
        trainingDataTargets = np.clip(trainingDataTargets, 0., 1.)

    autoencoder.compile(
        optimizer=optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
    )
    autoencoder.fit(
        trainingData,
        trainingDataTargets,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
        validation_data=(validationData, validationData),
        validation_steps=validationSteps,
    )
    return autoencoder, encoder, decoder
