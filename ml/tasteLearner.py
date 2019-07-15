from os import listdir
from os.path import join, exists
import numpy as np
from models.perceptron import dynamicPerceptron
from dataHelpers import pairsFromCsv

ACCEPTABLE_MODEL_MAE_TRAINING = 0.04
MAX_MODEL_MAE_TO_SAVE = 0.1
MIN_REVIEWS_PER_PROFILE = 32
TASTE_SAVE_PATH = "../resources/data/profile/taste/"
TASTE_BLACKLIST_SAVE_PATH = "../resources/data/profile/taste_blacklist/"
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def main():
    inMae = []
    inMse = []
    outMae = []
    outMse = []
    succ = 0
    fail = 0
    skip = 0
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        profileTasteFile = join(TASTE_SAVE_PATH, filename)
        profileTasteBlacklistFile = join(TASTE_BLACKLIST_SAVE_PATH, filename)
        if not exists(profileReviewsFile):
            continue
        if exists(profileTasteFile) or exists(profileTasteBlacklistFile):
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
        if trainingExampleCount < MIN_REVIEWS_PER_PROFILE:
            skip += 1
            continue
        profileWeights, mae, mse = dynamicPerceptron(
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            batchSize=1,
            epochsPerTrain=2,
            idealMae=ACCEPTABLE_MODEL_MAE_TRAINING,
            learningRates=[0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005],
            stagnantEpochsAllowed=100,
            verbose=False,
        )
        if mae <= MAX_MODEL_MAE_TO_SAVE:
            np.savetxt(
                profileTasteFile,
                [profileWeights],
                fmt="%.10f",
                delimiter=',',
            )
            inMae.append(mae)
            inMse.append(mse)
        else:
            np.savetxt(
                profileTasteBlacklistFile,
                [profileWeights],
                fmt="%.10f",
                delimiter=',',
            )
            outMae.append(mae)
            outMse.append(mse)
        if len(inMae) > 0:
            print(
                'ACCEPT:\nAverage MAE:{}\nAverage MSE:{}\n'.format(
                    sum(inMae) / len(inMae),
                    sum(inMse) / len(inMse),
                )
            )
        if len(outMae) > 0:
            print(
                'REJECT:\nAverage MAE:{}\nAverage MSE:{}\n'.format(
                    sum(outMae) / len(outMae),
                    sum(outMse) / len(outMse),
                )
            )
        print('Successs: {}\nFail: {}\nSkip: {}'.format(succ, fail, skip))
        succ += 1
    else:
        fail += 1


if __name__ == "__main__":
    main()
