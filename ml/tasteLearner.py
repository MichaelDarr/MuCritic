from os import listdir
from os.path import join, exists
import numpy as np
from models.perceptron import perceptron
from dataHelpers import pairsFromCsv

MIN_REVIEWS_PER_PROFILE = 10
MIN_REVIEWS_FOR_TRAINING = 500
TASTE_SAVE_PATH = "../resources/data/profile/taste/"
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def main():
    allMae = []
    allMse = []
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
            0,
            MIN_REVIEWS_FOR_TRAINING,
            skipHeader=0,
        )
        if trainingExampleCount < MIN_REVIEWS_PER_PROFILE:
            continue
        profilePerceptron, history = perceptron(
            trainFeatures,
            trainLabels,
            batchSize=4,
            epochs=250,
            learningRate=0.001,
        )
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
        allMae.append(history.history['mae'][-1])
        allMse.append(history.history['mse'][-1])
        print(
            'Average MAE:{}\nAverage MSE:{}\n'.format(
                sum(allMae) / len(allMae),
                sum(allMse) / len(allMse),
            )
        )


if __name__ == "__main__":
    main()
