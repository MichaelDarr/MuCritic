from models.denseNet import denseNet
from dataHelpers import pairsFromCsvFiles
import tensorflowjs as tfjs

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
        labelBuckets=['2', '3', '4'],
    )
    model = denseNet(
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        activation='relu',
        batchSize=1,
        dropoutRate=0,
        epochs=100,
        learningRate=0.0005,
        regularizationRate=0.1,
    )

    tfjs.converters.save_keras_model(
        model,
        MODEL_SAVE_PATH,
    )


if __name__ == "__main__":
    main()
