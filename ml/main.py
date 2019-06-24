from models import createAndTrainAutoencoder, createAndTrainPerceptron
from data import fromCsv, pairsFromCsv
from os import listdir
from os.path import join

ALBUM_DATA_FILE = "../resources/data/albums-normalized.csv"
PROFILE_DATA_PATH = "../resources/data/profiles/"


def main():
    # train an autoencoder on all albums
    train, validation, test = fromCsv(
        ALBUM_DATA_FILE,
        4000,
        4000,
    )
    autoencoder, encoder, decoder = createAndTrainAutoencoder(
        train,
        validation,
        24,
        epochs=200,
        learningRate=0.0005,
    )

    allPerceptronWeights = []
    for f in listdir(PROFILE_DATA_PATH):
        proFile = join(PROFILE_DATA_PATH, f)
        (
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            testFeatures,
            testLabels,
        ) = pairsFromCsv(
            proFile,
            0,
            0,
            1000,
        )
        trainFeaturesEncoded = encoder.predict(trainFeatures)
        perceptron, history = createAndTrainPerceptron(
            trainFeaturesEncoded,
            trainLabels,
            4,
            batchSize=64,
            epochs=500,
            learningRate=0.002,
        )
        if history.history['mae'][-1] < 0.2:
            allPerceptronWeights.append(
                perceptron.get_layer('perceptron-weights').weights
            )
    print(allPerceptronWeights)


if __name__ == "__main__":
    main()
