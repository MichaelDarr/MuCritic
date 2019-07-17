from models.autoencoder import autoencoder
from dataHelpers import fromCsvBuckets
import tensorflowjs as tfjs

MODEL_SAVE_PATH = "../resources/models/taste/"
TASTE_DIRECTORY = "../resources/data/profile/taste/"
BUCKETS_TO_USE = ['1', '2', '3']


def main():
    train, validation, test = fromCsvBuckets(
        TASTE_DIRECTORY,
        BUCKETS_TO_USE,
        0,
        -1,
        skipHeader=0,
    )
    print(train[0])
    (
        auto,
        encoder,
        decoder
    ) = autoencoder(
        train,
        validation,
        12,
        activation='selu',
        batchSize=4,
        epochs=10000,
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
