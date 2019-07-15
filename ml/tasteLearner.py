from os import listdir
from os.path import join, exists
import numpy as np
from models.variableRatePerceptron import variableRatePerceptron
from dataHelpers import pairsFromCsv

BUCKET_1_MAE_CAP = 0.04
BUCKET_2_MAE_CAP = 0.07
BUCKET_3_MAE_CAP = 0.1
BUCKET_4_MAE_CAP = 0.13
BUCKET_5_MAE_CAP = 0.16
BASE_SAVE_PATH = '../resources/data/profile/taste/'
ALL_SAVE_PATH = BASE_SAVE_PATH + 'all/'
BUCKET_1_SAVE_PATH = BASE_SAVE_PATH + '1/'
BUCKET_2_SAVE_PATH = BASE_SAVE_PATH + '2/'
BUCKET_3_SAVE_PATH = BASE_SAVE_PATH + '3/'
BUCKET_4_SAVE_PATH = BASE_SAVE_PATH + '4/'
BUCKET_5_SAVE_PATH = BASE_SAVE_PATH + '5/'
BUCKET_6_SAVE_PATH = BASE_SAVE_PATH + '6/'
MIN_REVIEWS_PER_PROFILE = 24
TASTE_BLACKLIST_SAVE_PATH = "../resources/data/profile/taste/"
PROFILE_REVIEWS_PATH = "../resources/data/profile/reviews/"


def printSummary(histDicts, header):
    if len(histDicts) > 0:
        maeAvg = 0
        mseAvg = 0
        valMaeAvg = 0
        valMseAvg = 0
        epochs = 0
        lrFreq = {
            0.0001: 0,
            0.0002: 0,
            0.0005: 0,
            0.001: 0,
            0.002: 0,
            0.005: 0,
            0.01: 0,
            0.02: 0,
            0.05: 0,
            0.1: 0,
            0.2: 0,
            0.5: 0,
            1: 0,
        }
        for histDict in histDicts:
            maeAvg += histDict['mae'] / len(histDicts)
            mseAvg += histDict['mse'] / len(histDicts)
            valMaeAvg += histDict['val_mae'] / len(histDicts)
            valMseAvg += histDict['val_mse'] / len(histDicts)
            epochs += histDict['epochs'] / len(histDicts)
            lrFreq[histDict['learningRate']] += 1
        print(
            '''{}\n{} epochs\tt_mae: {:.4f}\tt_mse: {:.4f}\
            v_mae: {:.4f}\tv_mse: {:.4f}'''.format(
                header,
                epochs,
                maeAvg,
                mseAvg,
                valMaeAvg,
                valMseAvg,
            )
        )
        learningRateString = 'Learning Rate Frequencies:'
        for rate, freq in lrFreq.items():
            if freq > 0:
                learningRateString += '{:.4f}:{}\t'.format(rate, freq)
        print(learningRateString)


def main():
    allHist = []
    for filename in listdir(PROFILE_REVIEWS_PATH):
        profileReviewsFile = join(PROFILE_REVIEWS_PATH, filename)
        profileTasteFile = join(ALL_SAVE_PATH, filename)
        if not exists(profileReviewsFile):
            continue
        if exists(profileTasteFile):
            continue
        (
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            testFeatures,
            testLabels,
            trainingExampleCount,
        ) = pairsFromCsv(
            profileReviewsFile,
            0,
            -1,
            skipHeader=0,
        )
        if trainingExampleCount < MIN_REVIEWS_PER_PROFILE:
            continue
        print('\nBeginning training for user {} ({} reviews)'.format(
            filename,
            trainingExampleCount,
        ))
        profileWeights, histDict = variableRatePerceptron(
            trainFeatures,
            trainLabels,
            validationFeatures,
            validationLabels,
            batchSize=2,
            epochsPerTrain=1,
            verbose=1,
            source=filename
        )
        savePath = join(ALL_SAVE_PATH, filename)
        bucketSavePath = BUCKET_6_SAVE_PATH
        if histDict['val_mae'] < BUCKET_1_MAE_CAP:
            bucketSavePath = BUCKET_1_SAVE_PATH
        elif histDict['val_mae'] < BUCKET_2_MAE_CAP:
            bucketSavePath = BUCKET_2_SAVE_PATH
        elif histDict['val_mae'] < BUCKET_3_MAE_CAP:
            bucketSavePath = BUCKET_3_SAVE_PATH
        elif histDict['val_mae'] < BUCKET_4_MAE_CAP:
            bucketSavePath = BUCKET_4_SAVE_PATH
        elif histDict['val_mae'] < BUCKET_5_MAE_CAP:
            bucketSavePath = BUCKET_5_SAVE_PATH
        bucketSavePath = join(bucketSavePath, filename)
        np.savetxt(
            savePath,
            [profileWeights],
            fmt="%.10f",
            delimiter=',',
        )
        np.savetxt(
            bucketSavePath,
            [profileWeights],
            fmt="%.10f",
            delimiter=',',
        )
        allHist.append(histDict)
        printSummary(
            allHist,
            'Finished training for user {} with {} reviews. New Average Stats:'
            .format(
                filename,
                trainingExampleCount,
            ),
        )


if __name__ == "__main__":
    main()
