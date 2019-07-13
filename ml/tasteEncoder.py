from models.autoencoder import autoencoder
from dataHelpers import fromCsvFiles
# import tensorflowjs as tfjs

TASTE_DATA_FILES = "../resources/data/profile/taste"
MODEL_SAVE_PATH = "../resources/models/"


def main():
    train, validation, test = fromCsvFiles(
        TASTE_DATA_FILES,
        0,
        20,
        skipHeader=0,
    )
    print(validation)
    (
        auto,
        encoder,
        decoder
    ) = autoencoder(
        train,
        validation,
        16,
        activation=None,
        batchSize=1,
        epochs=1000,
        learningRate=0.0005,
        lossFunction='mse',
    )

    # tfjs.converters.save_keras_model(
    #     auto,
    #     MODEL_SAVE_PATH + 'auto',
    # )
    # tfjs.converters.save_keras_model(
    #     encoder,
    #     MODEL_SAVE_PATH + 'encoder',
    # )
    # tfjs.converters.save_keras_model(
    #     decoder,
    #     MODEL_SAVE_PATH + 'decoder',
    # )


if __name__ == "__main__":
    main()
