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


def historyDict(history, epochs, learningRate):
    if history is None:
        return {
            'epochs': 0,
            'learningRate': 0,
            'mae': 10,
            'mse': 10,
            'val_mae': 10,
            'val_mse': 10,
        }
    return {
        'epochs': epochs,
        'learningRate': learningRate,
        'mae': history.history['mae'][-1],
        'mse': history.history['mse'][-1],
        'val_mae': history.history['val_mae'][-1],
        'val_mse': history.history['val_mse'][-1],
    }


def printHist(histDict):
    print(
        '\t\tt_mae: {:.4f}\tt_mse: {:.4f}\tv_mae: {:.4f}\tv_mse: {:.4f}'
        .format(
            histDict['mae'],
            histDict['mse'],
            histDict['val_mae'],
            histDict['val_mse'],
        )
    )


def printEpochReport(
    histDict,
    sequentialStagnantEpochs=0,
    headerText=None,
    tailText=None,
    printMetrics=True,
    sampleSize=None,
    source=None,
):
    reportbuilder = (
        '{}\tlearn: {:.4f}\tsmpls: {}\t{}'
        .format(
            headerText,
            histDict['learningRate'],
            sampleSize,
            source,
        )
    )
    if headerText is None:
        reportbuilder = 'Epoch {}'.format(histDict['epochs'])
        if sequentialStagnantEpochs > 0:
            reportbuilder += '(stale for {})'.format(sequentialStagnantEpochs)
    if tailText:
        reportbuilder += '\t{}'.format(tailText)
    print(reportbuilder)
    if printMetrics:
        printHist(histDict)


def variableRatePerceptron(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    activation='selu',
    source=None,
    stagnantEpochsAllowed=100,
    batchSize=16,
    epochsPerTrain=1,
    learningRates=[
        0.0001,
        0.0002,
        0.0005,
        0.001,
        0.002,
        0.005,
        0.01,
        0.02,
        0.05,
        0.1,
        0.2,
        0.5,
        1,
    ],
    lossFunction='mse',
    metrics=['mae', 'mse'],
    validationSteps=3,
    verbose=1,
):
    inputDimension = len(trainFeatures[0])
    sampleSize = len(trainFeatures)
    inputs = tf.keras.Input(shape=(inputDimension,))
    predictions = layers.Dense(
        1,
        activation=activation,
        name='perceptron-weights',
    )(inputs)

    blankPerceptron = Model(inputs=inputs, outputs=predictions)

    outerPocketWeights = None
    outerPocketHist = None
    for learningRate in learningRates:
        perceptron = models.clone_model(blankPerceptron)
        perceptron.compile(
            optimizer=tf.optimizers.Nadam(learningRate),
            loss=lossFunction,
            metrics=metrics,
        )
        currentEpoch = 0
        innerPocketWeights = None
        innerPocketHist = historyDict(
            None,
            currentEpoch,
            learningRate,
        )

        sequentialStagnantEpochs = 0
        while sequentialStagnantEpochs < stagnantEpochsAllowed:
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
            currentEpoch += epochsPerTrain
            if history.history['val_mae'][-1] - innerPocketHist['val_mae'] > 0:
                sequentialStagnantEpochs += epochsPerTrain
            else:
                innerPocketWeights = getPerceptronWeights(
                    perceptron,
                    'perceptron-weights',
                )
                innerPocketHist = historyDict(
                    history,
                    currentEpoch,
                    learningRate,
                )
                sequentialStagnantEpochs = 0
            if verbose > 2:
                printEpochReport(
                    innerPocketHist,
                    sampleSize=sampleSize,
                    source=source,
                    sequentialStagnantEpochs=sequentialStagnantEpochs,
                )
        headerText = 'val_mae did not decrease'
        if outerPocketHist is None:
            outerPocketWeights = innerPocketWeights
            outerPocketHist = innerPocketHist
            headerText = 'First Attempt'
        else:
            valDec = outerPocketHist['val_mae'] - innerPocketHist['val_mae']
            trainDec = outerPocketHist['mae'] - innerPocketHist['mae']
            # best attempt if val_mae falls at least half as much as mae rises
            if valDec > 0 and trainDec > (valDec * -2):
                outerPocketWeights = innerPocketWeights
                outerPocketHist = innerPocketHist
                headerText = 'New Best Attempt'
            elif valDec > 0:
                headerText = 'mae increase too large'
        if verbose > 1:
            printEpochReport(
                innerPocketHist,
                headerText=headerText,
                printMetrics=True,
                sampleSize=sampleSize,
                source=source,
                tailText='\tepochs: {}'.format(innerPocketHist['epochs']),
            )
    if verbose > 0:
        printEpochReport(
            outerPocketHist,
            headerText="Best Attempt:",
            printMetrics=True,
            sampleSize=sampleSize,
            source=source,
            tailText='\tepochs: {}'.format(innerPocketHist['epochs']),
        )
    return (
        outerPocketWeights,
        outerPocketHist,
    )
