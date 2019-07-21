from models.autoencoder import autoencoder
from dataHelpers import fromCsv
import tensorflowjs as tfjs

MODEL_SAVE_PATH = "../resources/models/artist/"
TRACKS_DATA_FILE = "../resources/data/artist/all/data.csv"


def main():
    train, validation, test = fromCsv(
        TRACKS_DATA_FILE,
        2000,
        2000,
        skipHeader=0,
    )
    (
        auto,
        encoder,
        decoder
    ) = autoencoder(
        train,
        validation,
        16,
        activation='selu',
        batchSize=4,
        epochs=100,
        hiddenDimension=22,
        learningRate=0.0005,
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
