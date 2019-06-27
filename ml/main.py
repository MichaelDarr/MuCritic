from models import (
    createAndTrainAutoencoder,
    createAndTrainPerceptron,
    createAndTrainSimpleNet,
)
from data import fromCsv, pairsFromCsv
from os import listdir
from os.path import join, exists
import numpy as np

ALBUM_DATA_FILE = "../resources/data/album/data.csv"
PROFILE_REVIEWS_PATH = "../resources/data/profile/"
PROFILE_ARTISTS_PATH = "../resources/data/artists/"
MODEL_SAVE_PATH = "../resources/models/"


def main():
    # train an autoencoder on all albums
    train, validation, test = fromCsv(
        ALBUM_DATA_FILE,
        4000,
        4000,
    )
    albumAutoencoder, albumEncoder, albumDecoder = createAndTrainAutoencoder(
        train,
        validation,
        24,
        epochs=200,
        learningRate=0.0005,
    )

    profileArtists = []
    profileWeights = []
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        if not exists(profileReviewsFile):
            continue
        profileArtistsFile = join(PROFILE_ARTISTS_PATH, filename)
        if not exists(profileArtistsFile):
            continue
        (
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            testFeatures,
            testLabels,
        ) = pairsFromCsv(
            profileReviewsFile,
            0,
            0,
            1000,
        )
        trainFeaturesEncoded = albumEncoder.predict(trainFeatures)
        perceptron, history = createAndTrainPerceptron(
            trainFeaturesEncoded,
            trainLabels,
            4,
            batchSize=64,
            epochs=500,
            learningRate=0.002,
        )
        if history.history['mae'][-1] < 0.2:
            rawWeights = (
                perceptron
                .get_layer('perceptron-weights')
                .weights[0]
                .numpy()
            )
            weightArr = []
            for weight in rawWeights:
                weightArr.append(weight[0])
            train, validation, test = fromCsv(
                profileArtistsFile,
                0,
                0,
            )
            profileArtists.append(np.array(train))
            profileWeights.append(np.array(weightArr))

    profileArtists = np.array(profileArtists)
    profileWeights = np.array(profileWeights)

    tasteNet, tasteHistory = createAndTrainSimpleNet(
        profileArtists,
        profileWeights,
        20,
    )

    albumAutoencoder.save(MODEL_SAVE_PATH + 'album/autoEncoder.h5')
    albumEncoder.save(MODEL_SAVE_PATH + 'album/encoder.h5')
    albumDecoder.save(MODEL_SAVE_PATH + 'album/decoder.h5')
    tasteNet.save(MODEL_SAVE_PATH + 'taste.h5')


if __name__ == "__main__":
    main()
