from models.denseNet import denseNet
from dataHelpers import pairsFromCsvFiles
import tensorflowjs as tfjs

PROFILE_TASTE_DATA_PATH = "../resources/data/profile/taste/"
PROFILE_ARTISTS_DATA_PATH = "../resources/data/profile/artists/encoded/"
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
        PROFILE_ARTISTS_DATA_PATH,
        PROFILE_TASTE_DATA_PATH,
        0,
        40,
        skipHeader=0,
    )

    model = denseNet(
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        [19, 18, 17],
        activation=None,
        batchSize=2,
        epochs=1000,
        learningRate=0.005,
    )

    tfjs.converters.save_keras_model(
        model,
        MODEL_SAVE_PATH + 'artist/tracks/model',
    )


if __name__ == "__main__":
    main()
