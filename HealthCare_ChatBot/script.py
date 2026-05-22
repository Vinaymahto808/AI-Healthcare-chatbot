from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline
import torch
PRETRAINED = "raynardj/ner-disease-ncbi-bionlp-bc5cdr-pubmed"
model = AutoModelForTokenClassification.from_pretrained(PRETRAINED)
tokenizer = AutoTokenizer.from_pretrained(PRETRAINED)
ners = pipeline(task="ner", model=model, tokenizer=tokenizer, framework="pt")

import pickle as pk
with open('newsave_model', 'wb') as f:
    pk.dump(ners, f)
