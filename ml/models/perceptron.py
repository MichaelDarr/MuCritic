import tensorflow as tf
from tensorflow.keras import layers, Model


def perceptron(
    trainFeatures,
    trainLabels,
    perceptronDimension,
    batchSize=256,
    epochs=200,
    learningRate=0.0002,
    lossFunction='mse',
    metrics=['mae', 'mse'],
    testingData=None,
):
    inputDimension = len(trainFeatures[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    predictions = layers.Dense(
        1,
        activation='relu',
        name='perceptron-weights'
    )(inputs)

    perceptron = Model(inputs=inputs, outputs=predictions)

    perceptron.compile(
        optimizer=tf.optimizers.Nadam(learningRate),
        loss=lossFunction,
        metrics=metrics,
    )
    history = perceptron.fit(
        trainFeatures,
        trainLabels,
        batch_size=batchSize,
        epochs=epochs,
        shuffle=True,
    )
    return perceptron, history
