# Week 9

## Density Estimation(异常检测)

### Problem Motivation

- Density Estimation Algotithm

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190726212204.png)

- Anomaly detection example

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190726212305.png)

### Gaussian Distribution(高斯分布或正态分布)

The formula for the Gaussian density is:
$$
p(x) = \frac{1}{\sqrt{2\pi}\sigma}\exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$
![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190726214415.png)

- Gaussian distribution example

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190726214501.png)

- Parameter estimation

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190726214536.png)

### Algorithm

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727170936.png)

- Anomaly detection example

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727171020.png)

## Building an Anomaly Detection System

### Developing and Evaluating an Anomaly Detection System

- the important of real-number evaluation

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727173409.png)

- Aircraft engines motivating example

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727173428.png)

- Alogorithm evaluation

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727173459.png)

### Anomaly Detection vs. Supervised Learning

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727175128.png)

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727175149.png)

### Choosing What Features to Use

- Non-gaussian features

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727180334.png)

- Error analysis for anomaly detection

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727180405.png)

- Monitoring computers in a data center

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727180422.png)

## Multivariate Gaussian Distribution(Optional)

### Multivariate Gaussian Distribution

- Motivating example:Monitoring machines in a data center

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727181928.png)

- Multivariate Gaussian(Normal)distribution

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727181949.png)

- Multivariate Gaussian(Normal) examples

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182024.png)

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182046.png)

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182111.png)

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182133.png)

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182156.png)

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727182212.png)

### Anomaly Detection using the Multivariate Gaussian Distribution

- Multivariate Gaussian (Normal) distribution

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727183756.png)

- Anomaly detection with the multivariate Gaussian

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727183816.png)

- Relationship to original model

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727183846.png)

- Original model vs. Multivariate Gaussian

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727183913.png)

## Predicting Movie Ratings

### Problem Formulation

- Example : Predicting movie ratings

![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727192249.png)

### Content Based Recommendations

- Content-based recommender systems

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727193843.png)

- Problem formulation

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727193919.png)

- Optimization objective

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727193941.png)

- Optimization algorithm

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727193959.png)

## Collaborative Filtering

### Collaborative Filtering

- Problem motivation

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727195231.png)

- Optimization algorithm

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727195252.png)

- Collaborative filtering

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727195315.png)

### Collaborative Filtering Algorithm

- Collaborative filtering optimization objective

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727200726.png)

- Collaborative filtering algorithm

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727200745.png)

## Low Rank Matrix Factorization(低秩矩阵分解)

### Vectorization: Low Rank Matrix Factorization

- Collaborative filtering

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727202307.png)

- Finding related movies

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727202330.png)

### Implementational Detail: Mean Normalization

- Users  who have not reated any movies

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727234928.png)

- Mean Normalizatio

  ![](https://raw.githubusercontent.com/catwithtudou/photo/master/20190727235001.png)