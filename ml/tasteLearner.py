from os import listdir
from os.path import join, exists
import numpy as np
from models.perceptron import perceptron
from dataHelpers import pairsFromCsv

MIN_REVIEWS_PER_PROFILE = 20
MIN_REVIEWS_FOR_TRAINING = 1000
TASTE_SAVE_PATH = "../resources/data/profile/taste/"
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def main():
    allErrors = []
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        if not exists(profileReviewsFile):
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
        )
        if trainingExampleCount < MIN_REVIEWS_PER_PROFILE:
            continue
        profilePerceptron, history = perceptron(
            trainFeatures,
            trainLabels,
            batchSize=2,
            epochs=100,
            learningRate=0.0002,
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
            '{}{}'.format(TASTE_SAVE_PATH, filename),
            [weightArr],
            fmt="%.10f",
            delimiter=',',
        )
        allErrors.append(history.history['mae'][-1])
        print(
            'Errors:{}\nAverage Error:{}'.format(
                allErrors,
                sum(allErrors) / len(allErrors),
            )
        )


if __name__ == "__main__":
    main()
