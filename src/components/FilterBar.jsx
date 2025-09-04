import React from 'react';

const FilterBar = ({ filter, clearFilter }) => {
    if (!filter) return null;
    
    return (
        <div className="filter-bar active">
            <div className="filter-content">
                <span className="filter-label">Viewing:</span>
                <span className="filter-value">
                    {filter.fullBrand ? `Full ${filter.brand}` : filter.brand}
                </span>
                <button className="clear-filter" onClick={clearFilter}>Clear</button>
            </div>
        </div>
    );
};

export default FilterBar;
