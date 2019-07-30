from os import listdir
from os.path import join, exists
import numpy as np
from models.variableEpochPerceptron import (
    variableEpochPerceptron,
    summary,
)
from dataHelpers import pairsFromCsv

BUCKET_1_MAE_CAP = 0.05
BUCKET_2_MAE_CAP = 0.10
BUCKET_3_MAE_CAP = 0.15
BUCKET_4_MAE_CAP = 0.20
BUCKET_5_MAE_CAP = 0.25
BASE_SAVE_PATH = '../resources/data/profile/taste/'
ALL_SAVE_PATH = BASE_SAVE_PATH + 'all/'
BUCKET_1_SAVE_PATH = BASE_SAVE_PATH + '1/'
BUCKET_2_SAVE_PATH = BASE_SAVE_PATH + '2/'
BUCKET_3_SAVE_PATH = BASE_SAVE_PATH + '3/'
BUCKET_4_SAVE_PATH = BASE_SAVE_PATH + '4/'
BUCKET_5_SAVE_PATH = BASE_SAVE_PATH + '5/'
BUCKET_6_SAVE_PATH = BASE_SAVE_PATH + '6/'
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def main():
    allHist = []
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        profileTasteFile = join(ALL_SAVE_PATH, filename)
        if not exists(profileReviewsFile):
            continue
        if exists(profileTasteFile):
            continue

        (
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            testFeatures,
            testLabels,
            trainingExampleCount,
        ) = pairsFromCsv(
            profileReviewsFile,
            0,
            -1,
            skipHeader=0,
        )

        print('\nBeginning training for user {} ({} reviews)'.format(
            filename,
            trainingExampleCount,
        ))

        learningRates = [0.002]
        if trainingExampleCount < 2000:
            learningRates.append(0.02)
        if trainingExampleCount < 500:
            learningRates.append(0.2)

        profileWeights, histDict = variableEpochPerceptron(
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            batchSize=2,
            epochsPerTrain=1,
            learningRates=learningRates,
            verbose=0,
            source=filename,
            dropoutRate=0.1,
            regularlizationFactor=0.01,
            useBias=False,
        )

        savePath = join(ALL_SAVE_PATH, filename)
        bucketSavePath = BUCKET_6_SAVE_PATH
        if histDict['mae'] < BUCKET_1_MAE_CAP:
            bucketSavePath = BUCKET_1_SAVE_PATH
        elif histDict['mae'] < BUCKET_2_MAE_CAP:
            bucketSavePath = BUCKET_2_SAVE_PATH
        elif histDict['mae'] < BUCKET_3_MAE_CAP:
            bucketSavePath = BUCKET_3_SAVE_PATH
        elif histDict['mae'] < BUCKET_4_MAE_CAP:
            bucketSavePath = BUCKET_4_SAVE_PATH
        elif histDict['mae'] < BUCKET_5_MAE_CAP:
            bucketSavePath = BUCKET_5_SAVE_PATH
        bucketSavePath = join(bucketSavePath, filename)

        np.savetxt(
            savePath,
            [profileWeights],
            fmt="%.10f",
            delimiter=',',
        )
        np.savetxt(
            bucketSavePath,
            [profileWeights],
            fmt="%.10f",
            delimiter=',',
        )

        allHist.append(histDict)
        summary(
            histDict,
            allHist,
            'Finished training for user {} with {} reviews.'
            .format(
                filename,
                trainingExampleCount,
            ),
        )


if __name__ == "__main__":
    main()
