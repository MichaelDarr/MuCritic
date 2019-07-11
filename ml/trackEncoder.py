from models.autoencoder import autoencoder
from dataHelpers import fromCsv
import tensorflowjs as tfjs

MODEL_SAVE_PATH = "../resources/models/track/"
TRACKS_DATA_FILE = "../resources/data/track/all.csv"


def main():
    train, validation, test = fromCsv(
        TRACKS_DATA_FILE,
        40000,
        40000,
    )
    (
        auto,
        encoder,
        decoder
    ) = autoencoder(
        train,
        validation,
        13,
        batchSize=64,
        epochs=10,
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
