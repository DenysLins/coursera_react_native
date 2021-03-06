import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, Modal, StyleSheet, Button, Alert, PanResponder, Share } from 'react-native'; import { Card, Icon, Rating, Input, } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites,
    };
};

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});


const RenderDish = (props) => {

    const dish = props.dish;

    const recognizeDrag = ({ dx }) => {
        if (dx < -200)
            return true;
        else
            return false;
    };

    const recognizeComment = ({ dx }) => {
        if (dx > 200)
            return true;
        else
            return false;
    };

    handleViewRef = ref => this.view = ref;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: () => { this.view.rubberBand(1000).then(endState => console.log(endState.finished ? 'finished' : 'cancelled')); },
        onPanResponderEnd: (e, gestureState) => {
            console.log("pan responder end", gestureState);
            if (recognizeDrag(gestureState)) {
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + dish.name + ' to favorite?',
                    [
                        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                        { text: 'OK', onPress: () => { props.favorite ? console.log('Already favorite') : props.onPressFavorite(); } },
                    ],
                    { cancelable: false }
                );
            } else if (recognizeComment(gestureState)) {
                props.onPressComment();
            }

            return true;
        }
    });

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url
        }, {
                dialogTitle: 'Share ' + title
            });
    };

    if (dish != null) {
        return (
            <Animatable.View
                animation="fadeInDown"
                duration={2000}
                delay={1000}
                ref={this.handleViewRef}
                {...panResponder.panHandlers}>
                <Card featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }}>
                    <Text style={{ margin: 10 }}>
                        {dish.description}
                    </Text>
                    <View style={styles.iconsRow}>
                        <Icon style={styles.iconsItem} raised reverse name={props.favorite ? 'heart' : 'heart-o'} type='font-awesome' color='#f50' onPress={() => props.favorite ? console.log('Already favorite') : props.onPressFavorite()} />
                        <Icon style={styles.iconsItem} raised reverse name={'pencil'} type='font-awesome' color='#512DA8' onPress={() => props.onPressComment()} />
                        <Icon style={styles.iconsItem} raised reverse name='share' type='font-awesome' color='#51D2A8' onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} />
                    </View>
                </Card>
            </Animatable.View>
        );
    } else {
        return (
            <View></View>
        );
    }

};

const RenderComments = (props) => {

    const comments = props.comments;

    const renderCommentItem = ({ item, index }) => {

        return (
            <View key={index} style={{ margin: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                <Rating
                    type="star"
                    startingValue={item.rating}
                    readonly
                    imageSize={12}
                    style={{ paddingVertical: 10, alignItems: "flex-start" }}
                />
                <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date} </Text>
            </View>
        );
    };

    return (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
            <Card title='Comments' >
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.toString()}
                />
            </Card>
        </Animatable.View>
    );
};

class Dishdetail extends Component {

    constructor (props) {
        super(props);
        this.state = {
            rating: 1,
            author: "",
            comment: "",
            showModal: false
        };
    }

    static navigationOptions = {
        title: "Dish Details"
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal });
    }

    handleComments(dishId, rating, author, comment) {
        this.props.postComment(dishId, rating, author, comment);
        this.toggleModal();
    }

    resetForm() {
        this.setState({
            rating: 1,
            author: "",
            comment: "",
            showModal: false
        });
    }

    render() {
        const dishId = this.props.navigation.getParam('dishId', '');
        return (
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPressFavorite={() => this.markFavorite(dishId)}
                    onPressComment={() => this.toggleModal()}
                />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
                <Modal animationType={"slide"} transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => this.toggleModal()}
                    onRequestClose={() => this.toggleModal()}>
                    <View style={styles.modal}>
                        <Rating style={styles.modalBody}
                            showRating
                            type="star"
                            fractions={1}
                            startingValue={4}
                            imageSize={40}
                            onFinishRating={(value) => this.setState({ rating: value })}
                            style={{ paddingVertical: 10 }}
                        />
                        <Input style={styles.modalBody}
                            placeholder='Author'
                            leftIcon={{ type: 'font-awesome', name: 'user-o' }}
                            onChangeText={(value) => this.setState({ author: value })}
                        />
                        <Input style={styles.modalBody}
                            placeholder='Comment'
                            leftIcon={{ type: 'font-awesome', name: 'comment-o' }}
                            onChangeText={(value) => this.setState({ comment: value })}
                        />
                        <View style={styles.modalBody}>
                            <Button
                                onPress={() => {
                                    this.toggleModal(); this.resetForm(); this.handleComments(dishId, this.state.rating, this.state.author, this.state.comment);
                                }}
                                color="#512DA8"
                                title="Submit"
                            />
                        </View>
                        <View style={styles.modalBody}>
                            <Button
                                onPress={() => { this.toggleModal(); this.resetForm(); }}
                                color="#999999"
                                title="Cancel"
                            />
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        );
    }

}

const styles = StyleSheet.create({
    iconsRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20
    },
    iconsItem: {
        flex: 1
    },
    modal: {
        justifyContent: 'center',
        margin: 20
    },
    modalBody: {
        margin: 10
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);
