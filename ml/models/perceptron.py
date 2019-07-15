import tensorflow as tf
from tensorflow.keras import layers, Model, models


def getPerceptronWeights(model, layerName):
    rawWeights = (
        model
        .get_layer(layerName)
        .weights[0]
        .numpy()
    )
    weightArr = []
    for weight in rawWeights:
        weightArr.append(weight[0])
    return weightArr


def dynamicPerceptron(
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
    metrics=['mae', 'mse'],
    validationSteps=3,
    verbose=True,
):
    inputDimension = len(trainFeatures[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    predictions = layers.Dense(
        1,
        activation=activation,
        name='perceptron-weights',
    )(inputs)

    blankPerceptron = Model(inputs=inputs, outputs=predictions)

    outerPocketWeights = None
    outerPocketMae = None
    outerPocketMse = None
    for learningRate in learningRates:
        perceptron = models.clone_model(blankPerceptron)
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
        innerPocketWeights = getPerceptronWeights(
            perceptron,
            'perceptron-weights',
        )
        innerPocketMae = history.history['val_mae'][-1]
        innerPocketMse = history.history['val_mse'][-1]
        sequentialStagnantEpochs = 0
        currentEpoch = 0

        while sequentialStagnantEpochs < stagnantEpochsAllowed:
            if verbose:
                print(
                    'Epoch {:4d}  stale: {:2d}       mae: {:.4f}  mse: {:.4f}'
                    .format(
                        currentEpoch,
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
                sequentialStagnantEpochs += epochsPerTrain
            else:
                innerPocketWeights = getPerceptronWeights(
                    perceptron,
                    'perceptron-weights',
                )
                innerPocketMae = history.history['val_mae'][-1]
                innerPocketMse = history.history['val_mse'][-1]
                sequentialStagnantEpochs = 0
            currentEpoch += epochsPerTrain
        if innerPocketMae <= idealMae:
            return innerPocketWeights, innerPocketMae, innerPocketMse
        elif outerPocketMae is None or innerPocketMae < outerPocketMae:
            outerPocketWeights = innerPocketWeights
            outerPocketMae = innerPocketMae
            outerPocketMse = innerPocketMse

    return outerPocketWeights, outerPocketMae, outerPocketMse
