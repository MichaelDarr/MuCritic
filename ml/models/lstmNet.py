import tensorflow as tf
from tensorflow.keras import layers, Model


def lstmNet(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    activation='selu',
    batchSize=256,
    dropoutRate=0.5,
    recurrentDropoutRate=0.5,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    regularlizationFactor=0.01,
    validationSteps=3,
):
    featureCount = len(trainFeatures[0][0])
    labelDimensions = len(trainLabels[0])
    sequenceLength = len(trainFeatures[0])
    inputData = layers.Input(shape=(sequenceLength, featureCount))
    x = layers.LSTM(
        labelDimensions,
        dropout=dropoutRate,
        implementation=1,
        kernel_regularizer=tf.keras.regularizers.l2(regularlizationFactor),
        recurrent_regularizer=tf.keras.regularizers.l2(regularlizationFactor),
        recurrent_dropout=recurrentDropoutRate,
        return_sequences=False,
        return_state=False,
        unroll=True,
    )(inputData)

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
