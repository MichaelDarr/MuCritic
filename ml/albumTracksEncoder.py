from models.lstmAutoencoder import lstmAutoencoder
from dataHelpers import fromCsvFiles
import tensorflowjs as tfjs

ALBUM_DATA_FILES = "../resources/data/album/"
MODEL_SAVE_PATH = "../resources/models/"


def main():
    train, validation, test = fromCsvFiles(
        ALBUM_DATA_FILES,
        2000,
        2000,
        skipHeader=0,
    )
    (
        auto,
        encoder,
        decoder
    ) = lstmAutoencoder(
        train,
        validation,
        sequenceLength=6,
        featureCount=13,
        encodingDimension=24,
        hiddenDimension=48,
        batchSize=64,
        epochs=2000,
        learningRate=0.0005,
    )

    tfjs.converters.save_keras_model(
        auto,
        MODEL_SAVE_PATH + 'album/tracks/auto',
    )
    tfjs.converters.save_keras_model(
        encoder,
        MODEL_SAVE_PATH + 'album/tracks/encoder',
    )
    tfjs.converters.save_keras_model(
        decoder,
        MODEL_SAVE_PATH + 'album/tracks/decoder',
    )


if __name__ == "__main__":
    main()
