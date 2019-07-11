import tensorflow as tf
from tensorflow.keras import layers, Model


def simpleNet(
    trainFeatures,
    trainLabels,
    intermediateDimension,
    epochs=5000,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    testingData=None,
):
    inputDimension = len(trainFeatures[0])
    outputDimension = len(trainLabels[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    x = layers.Dense(intermediateDimension)(inputs)
    x = layers.Dense(outputDimension)(x)

    model = Model(inputs, x)

    model.compile(
        optimizer=tf.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
    )
    history = model.fit(
        trainFeatures,
        trainLabels,
        epochs=epochs,
        shuffle=True,
    )
    return model, history
