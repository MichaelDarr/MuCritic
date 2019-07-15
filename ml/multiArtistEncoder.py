from models.lstmAutoencoder import lstmAutoencoder
from dataHelpers import fromCsvFiles
import tensorflowjs as tfjs

MODEL_SAVE_PATH = "../resources/models/artist/multi/"
ARTISTS_DATA_FILES = "../resources/data/profile/artists/"


def main():
    train, validation, test = fromCsvFiles(
        ARTISTS_DATA_FILES,
        20,
        20,
        skipHeader=0,
    )

    (
        auto,
        encoder,
        decoder
    ) = lstmAutoencoder(
        train,
        validation,
        sequenceLength=5,
        featureCount=16,
        encodingDimension=20,
        batchSize=1,
        epochs=750,
        hiddenDimension=28,
        learningRate=0.0002,
    )

    tfjs.converters.save_keras_model(
        auto,
        MODEL_SAVE_PATH + 'auto',
    )
    tfjs.converters.save_keras_model(
        encoder,
        MODEL_SAVE_PATH + 'encoder',
    )
    tfjs.converters.save_keras_model(
        decoder,
        MODEL_SAVE_PATH + 'decoder',
    )


if __name__ == "__main__":
    main()
