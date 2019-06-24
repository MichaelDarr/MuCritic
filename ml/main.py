from models import autoencode
from data import fromCsv


def main():
    train, test, validation = fromCsv(
        "../resources/data/albums-normalized.csv",
        4000,
        4000,
    )
    autoencoder, encoder, decoder = autoencode(
        train,
        validation,
        16
    )


if __name__ == "__main__":
    main()
