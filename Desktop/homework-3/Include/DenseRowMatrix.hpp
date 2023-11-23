//
//  DenseRowMatrix.hpp
//  Main
//
//  Created by Jonathan Seyoum on 11/16/23.
//

#ifndef DenseRowMatrix_hpp
#define DenseRowMatrix_hpp

#include "AbstractMatrix.hpp"

class DenseRowMatrix : public AbstractMatrix {
private:
    double* _data;
    int _rows, _columns;

public:
    DenseRowMatrix(int rows, int columns);
    ~DenseRowMatrix();

    double operator()(int row, int column) const override;
    // Other member functions if needed
};

#include <stdio.h>

#endif /* DenseRowMatrix_hpp */
