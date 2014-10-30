window.initializing = true; // used to prevent event handlers from firing onload

$(document).ready( function() {
	$("#input-component nav ul li").click( function() {
		$(this).siblings().removeClass('select-this-nav');
		$(this).addClass('select-this-nav');
	});
	$("#choose-major li").click( function() {
		$(this).siblings().removeClass('selected-major');
		$(this).addClass('selected-major');
	});
})

var CleanSlateApp = angular.module('CleanSlateApp', []);

CleanSlateApp.controller('CleanSlateController', function ($scope) {

	/* View Controller Variable Declaration */
	$scope.Schedule = {
		fall_quarter : [],
		winter_quarter : [],  
		spring_quarter : []   
	}; 
	$scope.StudentInput = {
		ap_credit : [
			{
				input_type : 'ap_credit'
			}
		],
		transfer_credit : [],
		previous_experience : []
	};  
	$scope.CurrentStep = {};
	$scope.APTests = [];

	/* View Controller Variable Initialization */
	$scope.CurrentStep = window.Steps[0];
	$scope.APTests = window.APTests;

	/* Event listeners */
	$scope.$watch('StudentInput', function() {
		if(initializing)
			initializing = false;
		else 
			$scope.updateScheduleWithNewInput();
	}, true);

	$scope.$watch('CurrentStep', function() {
		if(initializing)
			initializing = false;
		else 
			$scope.decideWhichNavToSelect();
	}, true);

	
	/* Methods */

	/**
	 * This function is called on change of the StudentInput object. 
	 * This calls computeNewSchedule() which is in the file: js > compute_new_schedule.js. 
	 * The returned object assigned to $scope.Schedule and therefore updates in the view
	 */
	$scope.updateScheduleWithNewInput = function() {
		$scope.Schedule = computeNewSchedule($scope.StudentInput, $scope.Schedule);
	}

	/**
	 * Used to assign a CSS class that changes the color of the element based on 
	 * the course category.
	 */
	$scope.assignCSSCourseClass = function() {
		switch(this.course.category) {
			case 'engineering' :
				return 'engineering-course';

			case 'math_and_science' :
				return 'math-course';

			case 'humanities_and_social_science' : 
				return 'humanities-course';

			case 'other' :
				return 'other-course';
		}
	};

	/**
	 * Sets a default schedule during step 1 when a user clicks a major
	 *
	 * @param{String} major - either cse wde
	 */
	$scope.setMajor = function(major) {
		if(major === 'cse')
			$scope.Schedule = window.DefaultScheduleCSE; // in js/objects.js
		else if(major === 'wde')
			$scope.Schedule = window.DefaultScheduleWDE; // in js/objects.js
	}

	/**
	 * Goes to the previous step in the application
	 */
	$scope.goToPrevStep = function() {
		var prev_step_index = $scope.CurrentStep.step_number - 2;
		$scope.CurrentStep = window.Steps[prev_step_index];
	}

	/**
	 * Goes to the next step in the application
	 */
	$scope.goToNextStep = function() {
		var next_step_index = $scope.CurrentStep.step_number;
		$scope.CurrentStep = window.Steps[next_step_index];
	}

	/**
	 * Skips to a step if a user clicks directly on a button in the nav
	 *
	 * @param {Number} step - step # to skip to
	 */
	$scope.skipToStep = function(step) {
		$scope.CurrentStep = window.Steps[step];
	}

	/**
	 * Decides which nav (AP Credit, Transfer Credit, or Previous Experience)
	 * should be selected based on the current step
	 */
	$scope.decideWhichNavToSelect = function() {
		var child_to_select = $scope.CurrentStep.step_number - 1;
		if($scope.CurrentStep.step_number > 1 && $scope.CurrentStep.step_number < 5) {
			$("#input-component nav ul li").removeClass('select-this-nav');
			$("#input-component nav ul li:nth-child(" + child_to_select + ")").addClass('select-this-nav');
		}
	}

	/**
	 * I used this function to test if the updateScheduleWithNewInput() function
	 * is called on change of the StudentInput object. I also tested if the file
	 * js > compute_new_schedule.js was linked correctly and the ComputeNewSchedule()
	 * function was called with the correct data.
	 *
	 * This function is called when you click on "print"
	 *
	 * UPDATE ------ EVERYTHING WORKS
	 */
	$scope.testScheduleUpdate = function() {
		$scope.StudentInput.ap_credit[0] += 'lalalala';
	}

	$scope.showDescription = function() {
		$('#selection-description').text(test.description)
	}
});