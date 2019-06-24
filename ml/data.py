import numpy as np
import random


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

    random.shuffle(data)

    test = data[:testSize]
    validation = data[testSize:testSize + validationSize]
    train = data[testSize + validationSize:]

    return train, test, validation
