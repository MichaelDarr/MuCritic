import tensorflow as tf
from tensorflow.keras import layers, Model


def denseNet(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    intermediateDimensions,
    activation='selu',
    batchSize=64,
    epochs=5000,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    testingData=None,
    validationSteps=3,
):
    inputDimension = len(trainFeatures[0])
    outputDimension = len(trainLabels[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    for dimension in intermediateDimensions:
        x = layers.Dense(
            dimension,
            activation=activation,
        )(inputs)
    x = layers.Dense(outputDimension)(x)

    model = Model(inputs, x)

    model.compile(
        optimizer=tf.optimizers.Nadam(learningRate),
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
