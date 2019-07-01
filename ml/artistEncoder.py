from models import createAndTrainLstmAutoencoder
from data import fromCsvFiles

ARTIST_DATA_FILES = "../resources/data/artist/"


def main():
    train, validation, test = fromCsvFiles(
        ARTIST_DATA_FILES,
        2000,
        2000,
    )
    (
        albumAutoencoder,
        albumEncoder,
        albumDecoder
    ) = createAndTrainLstmAutoencoder(
        train,
        validation,
        10,
        15,
        24,
        batchSize=256,
        epochs=200,
        learningRate=0.0005,
    )


if __name__ == "__main__":
    main()
