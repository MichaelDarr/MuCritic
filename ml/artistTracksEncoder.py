from ml.models.lstmAutoencoder import lstmAutoencoder
from data import fromCsvFiles
import tensorflowjs as tfjs

ARTIST_DATA_FILES = "../resources/data/artist/"
MODEL_SAVE_PATH = "../resources/models/"


def main():
    train, validation, test = fromCsvFiles(
        ARTIST_DATA_FILES,
        2000,
        2000,
    )
    (
        auto,
        encoder,
        decoder
    ) = lstmAutoencoder(
        train,
        validation,
        sequenceLength=5,
        featureCount=15,
        encodingDimension=32,
        hiddenDimension=64,
        batchSize=16,
        epochs=4000,
        learningRate=0.0002,
    )

    tfjs.converters.save_keras_model(
        auto,
        MODEL_SAVE_PATH + 'artist/tracks/auto',
    )
    tfjs.converters.save_keras_model(
        encoder,
        MODEL_SAVE_PATH + 'artist/tracks/encoder',
    )
    tfjs.converters.save_keras_model(
        decoder,
        MODEL_SAVE_PATH + 'artist/tracks/decoder',
    )


if __name__ == "__main__":
    main()
