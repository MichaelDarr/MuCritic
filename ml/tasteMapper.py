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
        10,
        10,
        skipHeader=0,
        labelBuckets=['1', '2', '4', '5', '6', '3'],
    )
    model = denseNet(
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        activation='relu',
        batchSize=2,
        dropoutRate=0,
        epochs=2000,
        learningRate=0.0002,
        regularizationRate=0.25,
        intermediateDimensions=[17, 19],
    )

    tfjs.converters.save_keras_model(
        model,
        MODEL_SAVE_PATH,
    )


if __name__ == "__main__":
    main()
