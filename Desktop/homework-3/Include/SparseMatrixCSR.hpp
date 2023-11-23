//
//  SparseMatrixCSR.hpp
//  Main
//
//  Created by Jonathan Seyoum on 11/16/23.
//

#ifndef SparseMatrixCSR_hpp
#define SparseMatrixCSR_hpp

#include "AbstractMatrix.hpp"

class SparseMatrixCSR : public AbstractMatrix {
private:
    double* _nzval;
    int* _col_index;
    int* _row_index;
    int _rows, _columns, _nonzeros;

public:
    SparseMatrixCSR(int rows, int columns, int nonzeros, int* row_indices, int* col_indices, double* values);
    ~SparseMatrixCSR();

    double operator()(int row, int column) const override;
    double* get_nzval() const;
    int* get_col_index() const;
    int* get_row_index() const;
    // Other member functions if needed
};

#include <stdio.h>

#endif /* SparseMatrixCSR_hpp */
