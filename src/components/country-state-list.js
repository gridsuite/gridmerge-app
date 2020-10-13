/**
 * Copyright (c) 2020, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { Component } from 'react';
import { List } from '@material-ui/core';
import PropTypes from 'prop-types';
import CountryStateItem from './country-state-item';

class CountryStatesList extends Component {
    render() {
        return (
            <List className={this.props.className}>
                {this.props.igms.map((igm) => (
                    <CountryStateItem igm={igm} />
                ))}
            </List>
        );
    }
}

CountryStatesList.defaultProps = {
    igms: [],
};

CountryStatesList.propTypes = {
    classes: PropTypes.object.isRequired,
    igms: PropTypes.arrayOf(
        PropTypes.shape({
            tso: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
        })
    ),
};

//eslint-disable-next-line
export default CountryStatesList;
