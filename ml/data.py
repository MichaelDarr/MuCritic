import numpy as np


def fromCsv(
    fileName,
    testSize,
    validationSize,
    delimiter=',',
    fillingValues=0,
    skipHeader=1,
):
    data = np.genfromtxt(
        fileName,
        skip_header=skipHeader,
        filling_values=fillingValues,
        delimiter=delimiter,
    )

    test = data[:testSize]
    validation = data[testSize:testSize + validationSize]
    train = data[testSize + validationSize:]

    return train, validation, test


def pairsFromCsv(
    fileName,
    testSize,
    validationSize,
    minSize,
    delimiter=',',
    fillingValues=0,
    skipHeader=1,
):
    train, validation, test = fromCsv(
        fileName=fileName,
        testSize=testSize,
        validationSize=validationSize,
        delimiter=delimiter,
        fillingValues=fillingValues,
        skipHeader=skipHeader,
    )

    trainFeatures = []
    trainLabels = []
    validationFeatures = []
    validationLabels = []
    testFeatures = []
    testLabels = []

    for i in range(len(train)):
        trainLabels.append(train[i][0])
        trainFeatures.append(train[i][1:])

    for i in range(len(validation)):
        validationLabels.append(validation[i][0])
        validationFeatures.append(validation[i][1:])

    for i in range(len(test)):
        testLabels.append(test[i][0])
        testFeatures.append(test[i][1:])

    while len(trainFeatures) < minSize:
        trainLabels += trainLabels
        trainFeatures += trainFeatures

    trainFeatures = np.array(trainFeatures)
    trainLabels = np.array(trainLabels)
    validationFeatures = np.array(validationFeatures)
    validationLabels = np.array(validationLabels)
    testFeatures = np.array(testFeatures)
    testLabels = np.array(testLabels)

    return (
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        testFeatures,
        testLabels,
    )
