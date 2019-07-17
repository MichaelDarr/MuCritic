import tensorflow as tf
from tensorflow.keras import layers, Model


def getPerceptronWeights(model, layerName):
    rawWeights = (
        model
        .get_layer(layerName)
        .weights[0]
        .numpy()
    )
    weightArr = [(
        model
        .get_layer(layerName)
        .weights[1]
        .numpy()[0]
    )]
    for weight in rawWeights:
        weightArr.append(weight[0])
    return weightArr


def historyDict(history, epochs, learningRate):
    if history is None:
        return {
            'epochs': 0,
            'mae': 10,
            'mse': 10,
            'val_mae': 10,
            'val_mse': 10,
        }
    return {
        'epochs': epochs,
        'mae': history.history['mae'][-1],
        'mse': history.history['mse'][-1],
        'val_mae': history.history['val_mae'][-1],
        'val_mse': history.history['val_mse'][-1],
    }


def printEpochReport(
    histDict,
    stale,
):
    epochString = 'Epoch {:<4d}'.format(histDict['epochs'])
    if stale != 0:
        epochString += '({} stale)'.format(stale)
    print(
        '{:20s}\tt_mae: {:.4f}\tt_mse: {:.4f}\tv_mae: {:.4f}\tv_mse: {:.4f}'
        .format(
            epochString,
            histDict['mae'],
            histDict['mse'],
            histDict['val_mae'],
            histDict['val_mse'],
        )
    )


def summary(histDict, histDicts, header):
    print(header)
    printEpochReport(histDict, 0)
    if len(histDicts) > 0:
        maeAvg = 0
        mseAvg = 0
        valMaeAvg = 0
        valMseAvg = 0
        epochs = 0
        for histDict in histDicts:
            maeAvg += histDict['mae'] / len(histDicts)
            mseAvg += histDict['mse'] / len(histDicts)
            valMaeAvg += histDict['val_mae'] / len(histDicts)
            valMseAvg += histDict['val_mse'] / len(histDicts)
            epochs += int(histDict['epochs'] / len(histDicts))
        print(
            '''{} Avg Epochs\
            t_mae: {:.4f}\tt_mse: {:.4f}\tv_mae: {:.4f}\tv_mse: {:.4f}'''
            .format(
                epochs,
                maeAvg,
                mseAvg,
                valMaeAvg,
                valMseAvg,
            )
        )


def histIsImprovement(oldHist, newHist):
    maeDecrease = oldHist['mae'] - newHist['mae']
    valMaeIncrease = newHist['val_mae'] - oldHist['val_mae']
    if maeDecrease > 0:
        if valMaeIncrease > 0:
            return newHist['mae'] >= newHist['val_mae']
        return True
    return False


def variableEpochPerceptron(
    trainFeatures,
    trainLabels,
    validationFeatures,
    validationLabels,
    source=None,
    staleEpochsAllowed=100,
    batchSize=16,
    epochsPerTrain=1,
    learningRates=[0.02, 0.002, 0.0002],
    lossFunction='mse',
    metrics=['mae', 'mse'],
    validationSteps=3,
    regularlizationFactor=0.01,
    dropoutRate=0.3,
    verbose=0,
):
    inputDimension = len(trainFeatures[0])
    inputs = tf.keras.Input(shape=(inputDimension,))
    dropout = layers.Dropout(dropoutRate)(inputs)
    predictions = layers.Dense(
        1,
        name='perceptron-weights',
        kernel_regularizer=tf.keras.regularizers.l2(regularlizationFactor),
    )(dropout)

    perceptron = Model(inputs=inputs, outputs=predictions)

    outerPocketWeights = None
    outerPocketHist = None
    for learningRate in learningRates:
        perceptron.compile(
            optimizer=tf.optimizers.Nadam(learningRate),
            loss=lossFunction,
            metrics=metrics,
        )
        currentEpoch = 0
        pocketWeights = None
        pocketHist = historyDict(
            None,
            currentEpoch,
            learningRate,
        )

        sequentialStagnantEpochs = 0
        while sequentialStagnantEpochs < staleEpochsAllowed:
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
            newHist = historyDict(
                history,
                currentEpoch,
                learningRate,
            )
            if histIsImprovement(pocketHist, newHist):
                pocketWeights = getPerceptronWeights(
                    perceptron,
                    'perceptron-weights',
                )
                pocketHist = historyDict(
                    history,
                    currentEpoch,
                    learningRate,
                )
                sequentialStagnantEpochs = 0
            else:
                sequentialStagnantEpochs += epochsPerTrain
            if verbose > 0:
                printEpochReport(
                    pocketHist,
                    sequentialStagnantEpochs,
                )
        if(
            outerPocketHist is None or
            histIsImprovement(outerPocketHist, pocketHist)
        ):
            outerPocketWeights = pocketWeights
            outerPocketHist = pocketHist
    return (
        outerPocketWeights,
        outerPocketHist,
    )
