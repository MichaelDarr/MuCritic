import tensorflow as tf
from models.lstmNet import lstmNet
from dataHelpers import pairsFromCsvFiles
import tensorflowjs as tfjs

PROFILE_TASTE_BUCKETS_PATH = "../resources/data/profile/taste/"
PROFILE_ARTISTS_PATH = "../resources/data/profile/artists/"
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
        PROFILE_ARTISTS_PATH,
        PROFILE_TASTE_BUCKETS_PATH,
        5,
        10,
        skipHeader=0,
        labelBuckets=['2', '3'],
    )
    trainFeatures = tf.keras.preprocessing.sequence.pad_sequences(
        trainFeatures,
        maxlen=10,
        dtype='float32',
        padding='pre',
        truncating='post',
        value=0.0
    )
    validationFeatures = tf.keras.preprocessing.sequence.pad_sequences(
        validationFeatures,
        maxlen=10,
        dtype='float32',
        padding='pre',
        truncating='post',
        value=0.0
    )
    model = lstmNet(
        trainFeatures,
        trainLabels,
        validationFeatures,
        validationLabels,
        batchSize=1,
        dropoutRate=0,
        recurrentDropoutRate=0,
        epochs=1000,
        learningRate=0.0005,
        regularlizationFactor=0.01,
    )

    tfjs.converters.save_keras_model(
        model,
        MODEL_SAVE_PATH,
    )


if __name__ == "__main__":
    main()
