import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const TBucksCoin = ({ size = 24, style }) => {
    const coinSize = size;
    const borderSize = Math.max(2, size * 0.1);
    const fontSize = size * 0.6;

    return (
        <View style={[styles.coin, { width: coinSize, height: coinSize, borderWidth: borderSize }, style]}>
            <View style={styles.innerRing} />
            <Text style={[styles.currencySymbol, { fontSize }]}>T</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    coin: {
        backgroundColor: '#FFD700', // Gold
        borderColor: '#B8860B', // Dark Golden Rod
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    innerRing: {
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#F0E68C', // Khaki
        opacity: 0.5,
    },
    currencySymbol: {
        color: '#B8860B', // Dark Golden Rod
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    }
});

TBucksCoin.propTypes = {
    size: PropTypes.number,
    style: PropTypes.object,
};

export default TBucksCoin;
