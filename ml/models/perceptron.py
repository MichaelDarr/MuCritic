import tensorflow as tf
from tensorflow.keras import layers, Model, models


def perceptron(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    activation='selu',
    idealMae=0.5,
    stagnantEpochsAllowed=20,
    batchSize=256,
    epochsPerTrain=1,
    learningRates=[0.0002],
    lossFunction='mse',
    maxEpochs=1000,
    metrics=['mae', 'mse'],
    validationSteps=3,
):
    inputDimension = len(trainFeatures[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    predictions = layers.Dense(
        1,
        activation=activation,
        name='perceptron-weights',
    )(inputs)

    perceptron = Model(inputs=inputs, outputs=predictions)

    outerPocketModel = None
    outerPocketMae = None
    outerPocketMse = None
    for learningRate in learningRates:
        perceptron.compile(
            optimizer=tf.optimizers.Nadam(learningRate),
            loss=lossFunction,
            metrics=metrics,
        )

        history = perceptron.fit(
            trainFeatures,
            trainLabels,
            batch_size=batchSize,
            epochs=epochsPerTrain,
            shuffle=True,
            validation_data=(validationFeatures, validationLabels),
            validation_steps=validationSteps,
            verbose=0,
        )
        innerPocketModel = perceptron
        innerPocketMae = history.history['val_mae'][-1]
        innerPocketMse = history.history['val_mse'][-1]
        sequentialStagnantEpochs = 0
        currentEpoch = 0

        while (
            sequentialStagnantEpochs < stagnantEpochsAllowed and
            currentEpoch < maxEpochs
        ):
            print(
                'Epoch {:4d}/{:4d}  stale:{:2d}    mae: {:.4f}  mse: {:.4f}'
                .format(
                    currentEpoch,
                    maxEpochs,
                    sequentialStagnantEpochs,
                    innerPocketMae,
                    innerPocketMse,
                )
            )
            history = perceptron.fit(
                trainFeatures,
                trainLabels,
                batch_size=batchSize,
                epochs=epochsPerTrain,
                shuffle=True,
                validation_data=(validationFeatures, validationLabels),
                validation_steps=validationSteps,
                verbose=0,
            )
            if history.history['val_mae'][-1] - innerPocketMae > 0:
                sequentialStagnantEpochs += 1
            else:
                innerPocketModel = models.clone_model(perceptron)
                innerPocketMae = history.history['val_mae'][-1]
                innerPocketMse = history.history['val_mse'][-1]
                sequentialStagnantEpochs = 0
            currentEpoch += 1
        if innerPocketMae <= idealMae:
            return innerPocketModel, innerPocketMae, innerPocketMse
        elif innerPocketMae < outerPocketMae:
            outerPocketModel = innerPocketModel
            outerPocketMae = innerPocketMae
            outerPocketMse = innerPocketMse

    return outerPocketModel, outerPocketMae, outerPocketMse
