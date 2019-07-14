import tensorflow as tf
from models.lstmNet import lstmNet
from dataHelpers import pairsFromCsvFiles
import tensorflowjs as tfjs

PROFILE_TASTE_SAVE_PATH = "../resources/data/profile/taste/"
PROFILE_ARTISTS_SAVE_PATH = "../resources/data/profile/reviews/"
MODEL_SAVE_PATH = "../resources/models/profile/taste"


def main():
    (
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        testFeatures,
        testLabels,
    ) = pairsFromCsvFiles(
        PROFILE_ARTISTS_SAVE_PATH,
        PROFILE_TASTE_SAVE_PATH,
        20,
        20,
        skipHeader=0,
    )
    trainFeatures = tf.keras.preprocessing.sequence.pad_sequences(
        trainFeatures,
        maxlen=25,
        dtype='float32',
        padding='pre',
        truncating='post',
        value=0.0
    )
    validationFeatures = tf.keras.preprocessing.sequence.pad_sequences(
        validationFeatures,
        maxlen=25,
        dtype='float32',
        padding='pre',
        truncating='post',
        value=0.0
    )
    print(trainFeatures[0])

    model = lstmNet(
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        16,
        activation='selu',
        batchSize=1,
        epochs=200,
        learningRate=0.0002,
    )

    tfjs.converters.save_keras_model(
        model,
        MODEL_SAVE_PATH + 'artist/tracks/model',
    )


if __name__ == "__main__":
    main()
