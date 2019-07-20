from tensorflow.keras import layers, optimizers, regularizers, Model


def autoencoder(
    trainingData,
    validationData,
    encodingDimension,
    trainingLabels=None,
    validationLabels=None,
    activation='relu',
    batchSize=256,
    dropoutRate=0.3,
    epochs=200,
    hiddenDimension=None,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    testingData=None,
    validationSteps=3,
    regularizationRate=0,
):
    inputDimension = len(trainingData[0])
    inputData = layers.Input(shape=(inputDimension,))
    encoded = layers.Dropout(dropoutRate)(inputData)
    if hiddenDimension is not None:
        encoded = layers.Dense(
            hiddenDimension,
            activation=activation,
            kernel_regularizer=regularizers.l2(regularizationRate),
        )(encoded)
    encoded = layers.Dense(
        encodingDimension,
        activation=activation,
        kernel_regularizer=regularizers.l2(regularizationRate),
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

    autoencoder.compile(
        optimizer=optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
    )
    if trainingLabels is None:
        trainingLabels = trainingData
    if validationLabels is None:
        validationLabels = validationData
    autoencoder.fit(
        trainingData,
        trainingLabels,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
        validation_data=(validationData, validationLabels),
        validation_steps=validationSteps,
    )
    return autoencoder, encoder, decoder
