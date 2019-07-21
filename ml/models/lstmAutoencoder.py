import tensorflow as tf
from tensorflow.keras import layers, Model


def lstmAutoencoder(
    trainingData,
    validationData,
    sequenceLength,
    featureCount,
    encodingDimension,
    hiddenDimension=None,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    validationSteps=3,
):
    inputData = layers.Input(shape=(sequenceLength, featureCount))
    encoded = inputData

    if hiddenDimension is not None:
        encoded = layers.LSTM(
            hiddenDimension,
            activation='tanh',
            recurrent_activation='sigmoid',
            recurrent_dropout=0,
            return_sequences=True,
            unroll=False,
            use_bias=True,
        )(encoded)
    encoded = layers.LSTM(
        encodingDimension,
        activation='tanh',
        recurrent_activation='sigmoid',
        recurrent_dropout=0,
        return_sequences=False,
        unroll=False,
        use_bias=True,
    )(encoded)

    x = layers.RepeatVector(
        sequenceLength,
        name='repeat-layer',
    )(encoded)

    x = layers.LSTM(
        encodingDimension,
        activation='tanh',
        recurrent_activation='sigmoid',
        recurrent_dropout=0,
        return_sequences=True,
        unroll=False,
        use_bias=True,
    )(x)
    if hiddenDimension is not None:
        x = layers.LSTM(
            hiddenDimension,
            activation='tanh',
            recurrent_activation='sigmoid',
            recurrent_dropout=0,
            return_sequences=True,
            unroll=False,
            use_bias=True,
        )(x)

    decoded = layers.TimeDistributed(layers.Dense(featureCount))(x)

    autoencoder = Model(inputData, decoded)
    encodedInput = layers.Input(shape=(encodingDimension,))
    repeatLayer = autoencoder.get_layer('repeat-layer')
    decoderLayer = None
    if hiddenDimension is not None:
        decoderLayer = autoencoder.layers[-1](
            autoencoder.layers[-2](
                autoencoder.layers[-3](
                    repeatLayer(encodedInput)
                )
            )
        )
    else:
        decoderLayer = autoencoder.layers[-1](
            autoencoder.layers[-2](
                repeatLayer(encodedInput)
            )
        )
    encoder = Model(inputData, encoded)
    decoder = Model(encodedInput, decoderLayer)

    autoencoder.compile(
        optimizer=tf.keras.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
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
