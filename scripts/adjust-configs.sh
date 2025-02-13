#!/bin/bash

# Script should be run from the root of the project.

# This script will iterate over the locales array and set the locale in the config.json file
locales=('it-IT' 'en-US')  # Array di lingue
default_locale='it-IT'  # Lingua predefinita. La configurazione su /it verrà copiata nella root.

absolute_file_path=$(realpath "$0")  # Percorso assoluto del file
current_dir=$(dirname "$absolute_file_path")  # Directory corrente

if ! command -v jq > /dev/null; then
  echo "jq is not installed, installing now... with 'sudo apt install -y jq'"
  sudo apt-get update
  sudo apt-get install -y jq
fi

for locale in "${locales[@]}"; do
  prod_config_file="$current_dir/../dist/lpda2/${locale%%-*}/assets/config/config.prod.json"  # Percorso del file di configurazione
  config_file="$current_dir/../dist/lpda2/${locale%%-*}/assets/config/config.json"  # Percorso del file di configurazione
  # echo "Setting locale to $locale in $config_file"

  # if config file exists, move it to config.json
  if [[ -f "$prod_config_file" ]]; then
    mv "$prod_config_file" "$config_file"
  fi

  if [[ ! -f "$config_file" ]]; then  # Se il file di configurazione non esiste
    # mkdir -p "/tmp/${locale}"  # Crea la directory
    echo "{}" > "$config_file"  # Crea il file di configurazione vuoto
  fi

  # Verifica se la chiave "locale" è presente
  if ! jq -e ".locale" "$config_file" > /dev/null; then
    # Aggiungi la chiave "locale" se non è presente
    jq '. + {"locale": "'"$locale"'"}' "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
  else
    # Aggiorna il valore della chiave "locale" se è presente
    jq '.locale = "'"$locale"'"' "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
  fi
done

# Copia la configurazione della lingua di default nella configurazione della root
cp "$current_dir/../dist/lpda2/${default_locale%%-*}/assets/config/config.json" "$current_dir/../dist/lpda2/assets/config/config.json"

# Elimina il file .prod.json per simmetria (altrimenti dentro / c'è, mentre dentro /it/ e /en/ non c'è.)
rm -rf "$current_dir/../dist/lpda2/assets/config/config.prod.json"
