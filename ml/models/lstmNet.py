import tensorflow as tf
from tensorflow.keras import layers, Model


def lstmNet(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    hiddenDimension,
    activation='selu',
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    validationSteps=3,
):
    featureCount = len(trainFeatures[0][0])
    labelDimensions = len(trainLabels[0])
    sequenceLength = len(trainFeatures[0])
    inputData = layers.Input(shape=(sequenceLength, featureCount))
    x = layers.Bidirectional(
        layers.LSTM(
            hiddenDimension,
            activation='tanh',
            recurrent_activation='sigmoid',
            recurrent_dropout=0,
            return_sequences=True,
            unroll=False,
            use_bias=True,
        )
    )(inputData)
    x = layers.Bidirectional(
        layers.LSTM(
            hiddenDimension,
            activation='tanh',
            recurrent_activation='sigmoid',
            recurrent_dropout=0,
            return_sequences=False,
            unroll=False,
            use_bias=True,
        )
    )(inputData)
    x = layers.Dense(labelDimensions, activation=activation)(x)

    model = Model(inputData, x)

    model.compile(
        optimizer=tf.keras.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
    )
    model.fit(
        trainFeatures,
        trainLabels,
        batch_size=batchSize,
        epochs=epochs,
        validation_data=(validationFeatures, validationLabels),
        validation_steps=validationSteps,
        shuffle=True,
    )
    return model
