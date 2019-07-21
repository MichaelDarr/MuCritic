from dataHelpers import pairsFromCsvFiles
import numpy as np

PROFILE_TASTE_BUCKETS_PATH = "../resources/data/profile/taste/"
PROFILE_ENCODED_ARTISTS_PATH = "../resources/data/profile/encodedArtists/"
MODEL_SAVE_PATH = "../resources/models/taste"


def main():
    (
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        testFeatures,
        testLabels,
    ) = pairsFromCsvFiles(
        PROFILE_ENCODED_ARTISTS_PATH,
        PROFILE_TASTE_BUCKETS_PATH,
        15,
        15,
        skipHeader=0,
        labelBuckets=['1', '2', '3', '4', '6', '5'],
    )
    allLabels = np.zeros(16)
    for user in trainLabels:
        allLabels += user
    for user in validationLabels:
        allLabels += user
    allLabels /= len(trainLabels) + len(validationLabels)
    for average in allLabels:
        print(average)


if __name__ == "__main__":
    main()
