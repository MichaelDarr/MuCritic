import numpy as np
from os import listdir
from os.path import join, isfile


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

    if validationSize == -1:
        validationSize = int(len(data) / 10)

    test = data[:testSize]
    validation = data[testSize:testSize + validationSize]
    train = data[testSize + validationSize:]

    return train, validation, test


def fromCsvBuckets(
    baseDirectory,
    bucketNames,
    testSize,
    validationSize,
    delimiter=',',
    fillingValues=0,
    skipHeader=1,
):
    data = []
    for bucket in bucketNames:
        for filename in listdir(join(baseDirectory, bucket)):
            extractedData = np.genfromtxt(
                join(baseDirectory, bucket, filename),
                skip_header=skipHeader,
                filling_values=fillingValues,
                delimiter=delimiter,
            )
            data.append(extractedData)

    if validationSize == -1:
        validationSize = int(len(data) / 5)

    test = data[:testSize]
    validation = data[testSize:testSize + validationSize]
    train = data[testSize + validationSize:]

    return np.array(train), np.array(validation), np.array(test)


def fromCsvFiles(
    fileDirectory,
    testSize,
    validationSize,
    delimiter=',',
    fillingValues=0,
    skipHeader=1,
):
    data = []
    for filename in listdir(fileDirectory):
        dataFile = join(fileDirectory, filename)
        if isfile(dataFile):
            extractedData = np.genfromtxt(
                dataFile,
                skip_header=skipHeader,
                filling_values=fillingValues,
                delimiter=delimiter,
            )
            data.append(extractedData)

    test = data[:testSize]
    validation = data[testSize:testSize + validationSize]
    train = data[testSize + validationSize:]

    return np.array(train), np.array(validation), np.array(test)


def pairsFromCsvFiles(
    fileDirectoryFeatures,
    fileDirectoryLabels,
    testSize,
    validationSize,
    delimiter=',',
    fillingValues=0,
    skipHeader=0,
    labelBuckets=None,
    skipBiasInLabels=False,
):
    features = []
    labels = []
    for filename in listdir(fileDirectoryFeatures):
        featureFile = join(fileDirectoryFeatures, filename)
        labelFile = None
        if labelBuckets:
            for bucket in labelBuckets:
                labelBucketFile = join(fileDirectoryLabels, bucket, filename)
                if isfile(labelBucketFile):
                    labelFile = labelBucketFile
                    break
        else:
            labelFile = join(fileDirectoryLabels, filename)
        if isfile(featureFile) and labelFile and isfile(labelFile):
            extractedFeatures = np.genfromtxt(
                featureFile,
                skip_header=skipHeader,
                filling_values=fillingValues,
                delimiter=delimiter,
            )
            extractedLabels = np.genfromtxt(
                labelFile,
                skip_header=skipHeader,
                filling_values=fillingValues,
                delimiter=delimiter,
            )
            features.append(extractedFeatures)
            if skipBiasInLabels:
                labels.append(extractedLabels[1:])
            else:
                labels.append(extractedLabels)

    testFeatures = features[:testSize]
    validationFeatures = features[testSize:testSize + validationSize]
    trainFeatures = features[testSize + validationSize:]

    testLabels = labels[:testSize]
    validationLabels = labels[testSize:testSize + validationSize]
    trainLabels = labels[testSize + validationSize:]

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


def pairsFromCsv(
    fileName,
    testSize,
    validationSize,
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
        len(train)
    )
