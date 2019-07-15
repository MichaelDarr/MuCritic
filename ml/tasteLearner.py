from os import listdir
from os.path import join, exists
import numpy as np
from models.perceptron import perceptron
from dataHelpers import pairsFromCsv

ACCEPTABLE_MODEL_MAE_TRAINING = 0.6
MAX_MODEL_MAE_TO_SAVE = 0.1
MIN_REVIEWS_PER_PROFILE = 32
TASTE_SAVE_PATH = "../resources/data/profile/taste/"
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def main():
    allMae = []
    allMse = []
    succ = 0
    fail = 0
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        profileTasteFile = join(TASTE_SAVE_PATH, filename)
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
        if trainingExampleCount < MIN_REVIEWS_PER_PROFILE:
            continue
        profilePerceptron, mae, mse = perceptron(
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            batchSize=1,
            epochsPerTrain=1,
            idealMae=ACCEPTABLE_MODEL_MAE_TRAINING,
            maxEpochs=2000,
            learningRates=[0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005],
            stagnantEpochsAllowed=100,
        )
        if mae <= MAX_MODEL_MAE_TO_SAVE:
            rawWeights = (
                profilePerceptron
                .get_layer('perceptron-weights')
                .weights[0]
                .numpy()
            )
            weightArr = []
            for weight in rawWeights:
                weightArr.append(weight[0])
            np.savetxt(
                profileTasteFile,
                [weightArr],
                fmt="%.10f",
                delimiter=',',
            )
            allMae.append(mae)
            allMse.append(mse)
            print(
                'Average MAE:{}\nAverage MSE:{}\n'.format(
                    sum(allMae) / len(allMae),
                    sum(allMse) / len(allMse),
                )
            )
            succ += 1
        else:
            print('Big Oof')
            fail += 1
    print('S: {}\nF: {}'.format(succ, fail))


if __name__ == "__main__":
    main()
