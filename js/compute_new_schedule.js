/**********************************************************************************
 * compute_new_schedule.js
 *
 *         All functions pertaining to the calculation and derivation of course
 *  schedules are held within this file.
 *
 *  This document is divided among the following sections
 *        - COURSE INFORMATION
 *        - SCHEDULE MANIPULATION
 *        - PRECOMPUTATION
 *        - MODIFICATION LOG
 *        - COMPUTATION
 *
 *  Currently, the following majors are implemented:
 *        - Computer Science and Engineering
 *
 **********************************************************************************
 */

//---------------------------------------------------------------------------------
// COURSE INFORMATION FUNCTIONS
//---------------------------------------------------------------------------------

/*
 * This function returns the course at a position for a given branch
 *
 * @param {string} branch : The name of the branch that the object is located (i.e. "math_courses")
 * @param {int} id : The id of the course on the branch
 */
function getCourse(branch, id) {
    return window.CourseCatalogue[branch][id];
}

/*
 * This function is called to return the id of the course on a specific branch with a specific department and course number
 *
 * @param {string} branch : The name of the branch that the object is located (i.e. "math_courses")
 * @param {string} department : The name of the course's department (i.e. "MATH")
 * @param {string} course_number : The course number (i.e. "11")
 */
function getCourseId(branch, department, course_number) {
    var _branch = window.CourseCatalogue[branch];
    for (course in _branch) {
        if (_branch[course]['department'] == department && _branch[course]['course_number'] == course_number)
            return course;
    }
    return -1; //Not found
}

function parentCourseInSameBranch(current_course, branch) {
    var prereqs = current_course['prerequisites'];
    for (prereq in current_course['prerequisites']) {
        if (current_course['prerequisites'][prereq][0] == branch) { //Found prereq in department, return that
            var branch = branch;
            var department = current_course['prerequisites'][prereq][1];
            var course_number = current_course['prerequisites'][prereq][2];
            var course_id = getCourseId(branch, department, course_number);
            return getCourse(branch, course_id);
        }
    }
    return null; //No prerequisite or none in department
}

/*
 * This function returns true if a course was taken before this quarter, false otherwise
 *
 * @param {object} course - Course object to be tested
 * @param {string} quarter - The current quarter ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function takenBeforeOrDuringThisQuarter(course, quarter) {
    var quarter_taken = course['quarter_taken'];

    if (course['credit'] == 'NO') { //If the course has never been taken, return false
        return false;
    }
    if (quarter_taken == '' && course['credit'] == 'YES') { //If the course was taken, but is no longer on the schedule
        return true;
    }
    if (quarter == 'spring_quarter') { //Must be taken before or during this quarter
        return true;
    }
    if (quarter == 'fall_quarter' && quarter_taken == 'fall_quarter') {
        return true;
    }
    if (quarter == 'winter_quarter' && quarter_taken != 'spring_quarter') {
        return true;
    }

    return false;
}

/*
 * This function returns if a course if offered this quarter (true if yes, false otherwise)
 *
 * @param {object} course - Course object to be tested
 * @param {string} quarter - The current quarter ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function offeredThisQuarter(course, quarter) {
    for (_quarter in course['offering']) {
        if (quarter == course['offering'][_quarter])
            return true;
    }
    return false;
}

/*
 * Returns true if a course has all of its prerequisites completed by this quarter, false otherwise
 *
 * @param {object} course - Course object to be tested
 * @param {string} quarter - Current quarter to check after ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function prereqsCompleted(course, quarter) {
    for (prereq in course['prerequisites']) {
        var prereq_branch = course['prerequisites'][prereq][0];
        var prereq_department = course['prerequisites'][prereq][1];
        var prereq_course_number = course['prerequisites'][prereq][2];

        var prereq_course = getCourse(prereq_branch, getCourseId(prereq_branch, prereq_department, prereq_course_number));
        //Look when prereq_course is in schedule, and if it is during/after current_quarter, then return false
        if (prereq_course['credit'] == 'NO') { //Prereq is not completed at all, return false
            return false;
        }
        switch(prereq_course['quarter_taken']){
            case 'spring_quarter':
                return false;
                break;
            case 'winter_quarter':
                if(quarter != 'spring_quarter') return false;
                break;
            case 'fall_quarter':
                if(quarter == 'fall quarter') return false;
                break;
            default:
                break;
        }
    }
    return true;
}

/* 
 * This function is called to return an array ([course, id]) of the next course and it's id in window.AllCourses
 *
 * @param {array} course_data - course data array of course to remove ([branch, department, course_number])
 * @param {int} id - id of course in window.AllClasses[branch]
 * @param {string} quarter - Current quarter to check after ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function nextCourseAfter(course_data, id, quarter) {
    var branch = course_data[0];
    var department = course_data[1];
    var course_number = course_data[2];

    var current_id = parseInt(id);
    var current_course = getCourse(branch, current_id);

    var parent_course = parentCourseInSameBranch(current_course, branch);
    if (parent_course == null) //No parent course, just increment pointer
        current_id++;
    else //Set current_id to element after parent's course
        current_id = parseInt(getCourseId(parent_course['branch'], parent_course['department'], parent_course['course_number'])) + 1;

    current_course = getCourse(branch, current_id);
    console.log(current_course['department'] + current_course['course_number'] + ': ' + takenBeforeOrDuringThisQuarter(current_course, quarter) + ', ' + !offeredThisQuarter(current_course, quarter) + ', ' +  !prereqsCompleted(current_course, quarter));
    while (takenBeforeOrDuringThisQuarter(current_course, quarter) || !offeredThisQuarter(current_course, quarter) || !prereqsCompleted(current_course, quarter)) {
        //If the course has been taken before, if the course is not being offered this quarter, or the prereqs are not completed
        //This means the course is not the next one to take, so continue along the branch and look for a different one to take
        if (current_id == window.AllCourses[branch].length - 1) { //At the last element, no more courses
            return null;
        }
        current_id++; //Go along branch
        current_course = getCourse(branch, current_id); //Get next course in branch
        console.log(current_course['department'] + current_course['course_number'] + ': ' + takenBeforeOrDuringThisQuarter(current_course, quarter) + ', ' + !offeredThisQuarter(current_course, quarter) + ', ' +  !prereqsCompleted(current_course, quarter));
    }

    console.log('returning ' + current_course['department'] + current_course['course_number']);
    return [getCourse(branch, current_id), current_id];
}

/*
 * Given an array of offerings and the current quarter (an offering), return the next quarter the course is offered (or -1)
 *
 * @param {array} offerings - Array of quarters offered (may contain "fall_quarter", "winter_quarter", and/or "spring_quarter")
 * @param {string} quarter - The current quarter ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function nextOffering(offerings, quarter) {
    if (quarter == 'spring_quarter') //No other courses, return -1
        return -1;
    else if (quarter == 'fall_quarter') {
        var next_offering = '';
        for (offering in offerings) {
            if (offerings[offering] == 'winter_quarter')
                next_offering = 'winter_quarter';
            if (offerings[offering] == 'spring_quarter' && next_offering != 'winter_quarter')
                next_offering = 'spring_quarter';
        }
        if (next_offering == '') //No other offerings after fall, return null
            return -1;
        return next_offering;
    } else if (quarter == 'winter_quarter') {
        for (offering in offerings) {
            if (offerings[offering] == 'spring_quarter')
                return 'spring_quarter';
        }
        return -1; //No other offerings after winter, return null
    }
}

/*
 * Returns the quarter (fall_quarter, winter_quarter, spring_quarter) that the course is being taken this year, or an empty string if it is not being taken this year
 * 
 * @param {Object} course_title - Title of course to be removed (i.e. "COEN10")
 */
function quarterTaken(course_title) {
    for (quarter in window.WorkingSchedule) {
        for (course in window.WorkingSchedule[quarter]) {
            if (course_title == course) {
                console.log(course_title + ' taken previously: ' + quarter);
                return quarter;
            }
        }
    }
    return ''; //Not taken before, return null
}

/*
 * This function is called to return the course location [branch, department, course_number] from a course title
 * 
 * @param {Object} course_title - Title of course (i.e. "COEN10")
 */
function getCourseLocFromTitle(course_title) {
    //Get the course's department and course number from course_title
    var start = 1;
    for (; start < course_title.length; start++) {
        if (parseInt(course_title[start]) == course_title[start]) //You found the first number, start of course_number
            break;
    }
    var course_department = course_title.substring(0, start);
    var course_c_number = course_title.substring(start, course_title.length);

    //Get the course's branch
    for (branch in window.AllCourses) {
        for (course in window.AllCourses[branch]) {
            if (window.AllCourses[branch][course]['department'] == course_department && window.AllCourses[branch][course]['course_number'] == course_c_number) {
                return [branch, course_department, course_c_number];
            }
        }
    }
}

function numberOfCoresInQuarter(quarter) {
    var quarter_schedule = window.WorkingSchedule[quarter];
    var cores_in_quarter = 0;
    for (course in quarter_schedule) {
        if (course.indexOf('CORE') > -1) //CORE## found in schedule
            cores_in_quarter++;
    }
    return cores_in_quarter;
}

function getACoreForQuarter(quarter) {
    var quarter_schedule = window.WorkingSchedule[quarter];
    for (course in quarter_schedule) {
        if (course.indexOf('CORE') > -1) //CORE## found in schedule
            return course;
    }
    return -1; //No cores, return -1
}

function nextCore(quarter) {
    var quarter_schedule = window.WorkingSchedule[quarter];
    for (var current_core = 0;;current_core++) { //Keep incrementing current core and return the first core that isnt in schedule
        if (!quarter_schedule['CORE' + current_core])
            return 'CORE' + current_core;
    }
}


function computeTotalUnitsWithoutEngr1(quarter) {
    var quarter_schedule = window.WorkingSchedule[quarter];
    var units = 0;

    for (course in quarter_schedule) {
        if (course == 'ENGR1')
            continue;
        else
            units += parseInt(quarter_schedule[course]['units']);
    }

    return units;
}




//---------------------------------------------------------------------------------
// SCHEDULE MANIPULATION FUNCTIONS
//---------------------------------------------------------------------------------

function moveEngr1() {
    var quarter_offered;
    for (quarter in window.WorkingSchedule) { //Find the quarter that ENGR1 
        for (course in window.WorkingSchedule[quarter]) {
            if (course == 'ENGR1') {
                quarter_offered = quarter;
                break;
            }
        }
        if (quarter_offered)
            break;
    }

    var total_units_fall = 0;
    var total_units_winter = 0;

    for (course in window.WorkingSchedule['fall_quarter']) {
        if (course == 'ENGR1')
            continue;
        else
            total_units_fall += parseInt(window.WorkingSchedule['fall_quarter'][course]['units']);
    }

    for (course in window.WorkingSchedule['winter_quarter']) {
        if (course == 'ENGR1')
            continue;
        else
            total_units_winter += parseInt(window.WorkingSchedule['winter_quarter'][course]['units']);
    }
    console.log(total_units_fall + ', ' + total_units_winter);
    if (total_units_fall > 17 && total_units_winter > 17) { //Cannot be placed anywhere, remove from schedule
        window.AllCourses['engineering_courses'][0]['quarter_taken'] = '';
        if (quarter_offered == 'fall_quarter') {
            delete window.WorkingSchedule['fall_quarter']['ENGR1'];
        }
        if (quarter_offered == 'winter_quarter') {
            delete window.WorkingSchedule['winter_quarter']['ENGR1'];
        }
        return;
    }

    if (total_units_fall <= total_units_winter && quarter_offered != 'fall_quarter') { //Move ENGR1 to fall
        window.AllCourses['engineering_courses'][0]['quarter_taken'] = 'fall_quarter';
        if (quarter_offered == 'winter_quarter') {
            delete window.WorkingSchedule['winter_quarter']['ENGR1'];
        }
        window.WorkingSchedule['fall_quarter']['ENGR1'] = {
            name : 'Introduction to Engineering + Lab',
            department : 'ENGR',
            course_number : '1',
            description : 'something',
            branch : 'engineering_courses',
            offering : ['fall_quarter', 'winter_quarter'],
            category : 'engineering',
            units : '2',
            prerequisites : [],
        };
    }

    else if (total_units_fall > total_units_winter && quarter_offered != 'winter_quarter') { //Move ENGR1 to winter
        window.AllCourses['engineering_courses'][0]['quarter_taken'] = 'winter_quarter';
        if (quarter_offered == 'fall_quarter') {
            delete window.WorkingSchedule['fall_quarter']['ENGR1'];
        }
        window.WorkingSchedule['winter_quarter']['ENGR1'] = {
            name : 'Introduction to Engineering + Lab',
            department : 'ENGR',
            course_number : '1',
            description : 'something',
            branch : 'engineering_courses',
            offering : ['fall_quarter', 'winter_quarter'],
            category : 'engineering',
            units : '2',
            prerequisites : [],
        };
    }
}

function fixCI() {
    if(window.AllCourses['CI_courses'][getCourseId('CI_courses','C&I',1)]['quarter_taken'] == ''){
        if (numberOfCoresInQuarter('fall_quarter') > 0 && numberOfCoresInQuarter('winter_quarter') > 0) {
            var fall_core = getACoreForQuarter('fall_quarter');
            var winter_core = getACoreForQuarter('winter_quarter');
            delete WorkingSchedule.fall_quarter[fall_core]; delete WorkingSchedule.winter_quarter[winter_core];
            WorkingSchedule.fall_quarter['C&I1'] = getCourse('CI_courses',getCourseId('CI_courses','C&I',1));
            window.AllCourses['CI_courses'][getCourseId('CI_courses','C&I',1)]['quarter_taken'] = 'fall_quarter';
            
            WorkingSchedule.winter_quarter['C&I2'] = getCourse('CI_courses',getCourseId('CI_courses','C&I',2));
            window.AllCourses['CI_courses'][getCourseId('CI_courses','C&I',2)]['quarter_taken'] = 'winter_quarter';

            return;
        }
        if (numberOfCoresInQuarter('winter_quarter') > 0 && numberOfCoresInQuarter('spring_quarter') > 0) {
            var winter_core = getACoreForQuarter('winter_quarter');
            var spring_core = getACoreForQuarter('spring_quarter');
            delete WorkingSchedule.winter_quarter[winter_core]; delete WorkingSchedule.spring_quarter[spring_core];
            WorkingSchedule.winter_quarter['C&I1'] = getCourse('CI_courses',getCourseId('CI_courses','C&I',1));
            window.AllCourses['CI_courses'][getCourseId('CI_courses','C&I',1)]['quarter_taken'] = 'winter_quarter';
            WorkingSchedule.spring_quarter['C&I2'] = getCourse('CI_courses',getCourseId('CI_courses','C&I',2));
            window.AllCourses['CI_courses'][getCourseId('CI_courses','C&I',2)]['quarter_taken'] = 'spring_quarter';

            return;
        }
    }
}

/*
 * This function is called to put COEN12 in the correct quarter, based on the completion of COEN10/11
 */
function fixCoen12() {
    if (!window.WorkingSchedule['winter_quarter']['COEN12'] && !window.WorkingSchedule['spring_quarter']['COEN12'])//If COEN12 isn't even in schedule, return
        return;

    if (window.WorkingSchedule['fall_quarter'][getACoreForQuarter('fall_quarter')]
        && window.WorkingSchedule['winter_quarter'][getACoreForQuarter('winter_quarter')]
        && window.WorkingSchedule['spring_quarter']['COEN12']) //Schedule is fixed, return
        return;

    var fall_quarter = window.WorkingSchedule['fall_quarter'];
    var winter_quarter = window.WorkingSchedule['winter_quarter'];
    var spring_quarter = window.WorkingSchedule['spring_quarter'];

    for (course in fall_quarter) {
        if (course == 'COEN10' || course == 'COEN11') //COEN10/11 is taken in the fall, no schedule fix needed
            return;
    }

    //If you are here, this means the COEN track is as follows:
    //  fall_quarter: CORE, winter_quarter: COEN12, spring_quarter: CORE
    //What it should be is this:
    //  fall_quarter: CORE, winter_quarter: CORE, spring_quarter: COEN12

    var coen12_id = getCourseId('coen_courses', 'COEN', '12');
    var coen12 = getCourse('coen_courses', coen12_id);

    //Move COEN12 to spring, delete CORE in spring
    delete window.WorkingSchedule['spring_quarter'][getACoreForQuarter('spring_quarter')];
    delete window.WorkingSchedule['winter_quarter']['COEN12'];
    window.WorkingSchedule['spring_quarter']['COEN12'] = {
        name : coen12['name'],
        department : coen12['department'],
        course_number : coen12['course_number'],
        description : coen12['description'],
        branch : 'coen_courses',
        offering : coen12['offering'],
        category : coen12['category'],
        units : coen12['units'],
        prerequisites: coen12['prerequisites'],
    };

    var winter_core = nextCore('winter_quarter');
    var core_course = getCourse('core_courses', 0);

    window.WorkingSchedule['winter_quarter'][winter_core] = {
        name : core_course['name'],
        department : core_course['department'],
        course_number : core_course['course_number'],
        description : core_course['description'],
        branch : 'core_courses',
        offering : core_course['offering'],
        category : core_course['category'],
        units: core_course['units'],
        prerequisites: core_course['prerequisites'],
    };
}

/*
 * This function is called to check each quarter for units, and removes CORES until there is a valid number of units
 */
function fixUnits() {
    var core_course = getCourse('core_courses', 0);

    var total_units_fall = computeTotalUnitsWithoutEngr1('fall_quarter');
    var total_units_winter = computeTotalUnitsWithoutEngr1('winter_quarter');
    var total_units_spring = computeTotalUnitsWithoutEngr1('spring_quarter');


    while (total_units_fall > 19) {
        var made_change = false;
        
        var fall_core = getACoreForQuarter('fall_quarter');
        if (fall_core != -1) { //There is a core to remove
            made_change = true;
            delete window.WorkingSchedule['fall_quarter'][fall_core];
        }
        
        if (!made_change) { //Cannot delete CORES alone, try to remove C&I's too
            console.log('ERROR: CANNOT GET FALL QUARTER BELOW 19 UNITS');
            break;
        }
        total_units_fall = computeTotalUnitsWithoutEngr1('fall_quarter');
    }

    while (total_units_winter > 19) {
        var made_change = false;
        
        var winter_core = getACoreForQuarter('winter_quarter');
        if (winter_core != -1) { //There is a core to remove
            made_change = true;
            delete window.WorkingSchedule['winter_quarter'][winter_core];
        }
        
        if (!made_change) { //Cannot delete CORES alone, try to remove C&I's too
            console.log('ERROR: CANNOT GET FALL QUARTER BELOW 19 UNITS');
            break;
        }
        total_units_winter = computeTotalUnitsWithoutEngr1('winter_quarter');
    }

    while (total_units_spring > 19) {
        var made_change = false;
        
        var spring_core = getACoreForQuarter('spring_quarter');
        if (spring_core != -1) { //There is a core to remove
            made_change = true;
            delete window.WorkingSchedule['spring_quarter'][spring_core];
        }
        
        if (!made_change) {
            console.log('ERROR: CANNOT GET WINTER QUARTER BELOW 19 UNITS');
            break;
        }
        total_units_spring = computeTotalUnitsWithoutEngr1('spring_quarter');
    }
}

/*
 * This function is called to remove a course from the default course list at a specific quarter
 * 
 * @param {Object} course_title - Title of course to be removed (i.e. "COEN10")
 * @param {string} quarter - The current quarter ("fall_quarter", "winter_quarter", or "spring_quarter")
 */
function removeCourse(course_title, quarter) {
    console.log(course_title + ', ' + quarter);
    if (quarter == -1) {  //Base case, return and break out of recursion
        fixCoen12(); //Move COEN12 based on if COEN10/11 are completed
        moveEngr1(); //Move engineering 1 to a better quarter
        fixUnits(); //Remove cores as necessary to get to required number of units
        return;
    }

    if (!quarter) { //If no quarter specified (first time), find the quarter and try again
        for (_quarter in window.WorkingSchedule) {
            if (course_title in window.WorkingSchedule[_quarter]) {
                removeCourse(course_title, _quarter);
                return;
            }
        }

        //If here, that means the course has not been taken yet. Find that course and set it to 'taken'.
        var start = 1;
        for (; start < course_title.length; start++) {
            if (parseInt(course_title[start]) == course_title[start]) //You found the first number, start of course_number
                break;
        }
        var course_department = course_title.substring(0, start);
        var course_c_number = course_title.substring(start, course_title.length);

        for (branch in window.AllCourses) {
            for (course in window.AllCourses[branch]) {
                if (window.AllCourses[branch][course]['department'] == course_department && window.AllCourses[branch][course]['course_number'] == course_c_number) {
                    window.AllCourses[branch][course]['credit'] = 'YES'; 
                    console.log(JSON.stringify(window.AllCourses[branch][course]));
                    return;
                }
            }
        }
    }

    var course = window.WorkingSchedule[quarter][course_title];
    if(!course){
        console.log('course in quarter not found');
        removeCourse('BASECASE', -1);
        return;
    }
    var id = getCourseId(course['branch'], course['department'], course['course_number']);
    var next_course_in_series = nextCourseAfter([course.branch, course.department, course.course_number], id, quarter);

    console.log(JSON.stringify(window.AllCourses[course['branch']][id]));
    console.log('removing ' + course_title + ' for ' + quarter);
    delete window.WorkingSchedule[quarter][course_title]; //Remove the course
    window.AllCourses[course['branch']][id]['quarter_taken'] = quarterTaken(course['department'] + course['course_number']); //Record that the course is no longer being taken

    if(next_course_in_series == null) { //Take core course
        var core_course = getCourse('core_courses', 0);
        var next_core = nextCore(quarter);

        window.WorkingSchedule[quarter][next_core] = {
            name : core_course['name'],
            department : core_course['department'],
            course_number : core_course['course_number'],
            description : core_course['description'],
            branch : 'core_courses',
            offering : core_course['offering'],
            category : core_course['category'],
            units : core_course['units'],
            prerequisites : core_course['prerequisites'],
        };
        
        removeCourse('BASECASE', -1);
    } else { //Take the next course in the series, if there is one
        var next_course = next_course_in_series[0];
        var next_course_id = next_course_in_series[1];

        window.AllCourses[course['branch']][next_course_id]['quarter_taken'] = quarter; //This course is now to be taken, give student credit
        window.AllCourses[course['branch']][next_course_id]['credit'] = 'YES'; //This course is now to be taken, give student credit
        console.log('adding ' + next_course['department'] + next_course['course_number'] + ' for ' + quarter);
        console.log('adding quarter taken for ' + next_course['department'] + next_course['course_number']);

        window.WorkingSchedule[quarter][next_course['department'] + next_course['course_number']] = {
            name : next_course['name'],
            department : next_course['department'],
            course_number : next_course['course_number'],
            description : next_course['description'],
            branch : course.branch,
            offering : next_course['offering'],
            category : next_course['category'],
            units : next_course['units'],
            prerequisites : next_course['prerequisites'],
        };
        console.log('recursively checking ' + nextOffering(next_course['offering'], quarter) + ' for ' + next_course['department'] + next_course['course_number']);
        removeCourse(next_course['department'] + next_course['course_number'], nextOffering(next_course['offering'], quarter));
    }
}








//---------------------------------------------------------------------------------
// PRECOMPUTATION FUNCTIONS
//---------------------------------------------------------------------------------


// CALCULUS READINESS -------------------------------------------------------------
function getEquivalentReadinessExam(){
    return [{function: 'removeCourse', parameters:['MATH9']}];
}

// PROGRAMMING EXPERIENCE----------------------------------------------------------
function getEquivalentProgrammingExperience(){
    return [{function: 'removeCourse', parameters:['COEN10']}];
}


// TRANSFER CREDIT-----------------------------------------------------------------
function getEquivalentTransferCredit(transfer_credit){
    var schedule_changes = [];

    for (course in window.TransferCredit[transfer_credit['id']]['fulfillment']) {
        course_info = window.TransferCredit[transfer_credit['id']]['fulfillment'][course];
        schedule_changes.push({
            function : 'removeCourse',
            parameters : [course_info[1] + course_info[2]]
        });
    }
    
    return schedule_changes;
}
    

// AP CREDIT-----------------------------------------------------------------------
function getEquivalentAPTest(ap_test)
{
    var mods = new Array();
    var test = window.APTests[ap_test.id];
        if (test.multiple_fulfillments) { //If there are multiple possibilities for AP test scores, go through each one and find the range that ap_test.score falls within, then test out of those classes
            for (test_fulfillment in test.multiple_fulfillments) { //For each fulfillment 
                var this_fulfillment = test.multiple_fulfillments[test_fulfillment];
                if (ap_test.score >= this_fulfillment.min_score && ap_test.score <= this_fulfillment.max_score) { //If ap_test.score falls within a certain range
                    for (course in this_fulfillment.fulfillment) { //For each course that is fulfilled
                        var this_course = this_fulfillment.fulfillment[course];
                        mods.push({
                            function : 'removeCourse',
                            parameters : [this_fulfillment.fulfillment[course][1] + this_fulfillment.fulfillment[course][2]]
                        });
                    }
                    return mods;
                }
            }
        } else {
            if (ap_test.score >= window.APTests[ap_test.id].min_score && ap_test.score <= window.APTests[ap_test.id].max_score) {
                for (course in window.APTests[ap_test.id].fulfillment) {
                    mods.push({
                        function : 'removeCourse',
                        parameters : [window.APTests[ap_test.id].fulfillment[course][1] + window.APTests[ap_test.id].fulfillment[course][2]]
                    } );
                }    
            }
        }
    return mods;
}








//---------------------------------------------------------------------------------
// MODIFICATION LOG FUNCTIONS
//---------------------------------------------------------------------------------

function applyMods(id,mods){
    if(!id || !mods) return;
    window.ModLog[id] = mods;
}

function removeMods(id){
    if(!id) return;
    console.log('THERE: ' + id);
    delete window.ModLog[id];
}







//---------------------------------------------------------------------------------
// COMPUTATION FUNCTIONS
//---------------------------------------------------------------------------------

function setBasePlan(maj){
    //Mark all courses as not taken
    for (branch in window.CourseCatalogue) {
        for (course in window.CourseCatalogue[branch]) {
            window.CourseCatalogue[branch][course]['credit'] = 'NO';
            window.CourseCatalogue[branch][course]['quarter_taken'] = '';
        }
    }
    
    switch(maj){
        case 'cse':
            window.BasePlan = jQuery.extend(true,{},window.DefaultScheduleCSE);    // (defined in objects.js)
            break;
        case 'wde':
            window.BasePlan = jQuery.extend(true,{},window.DefaultScheduleWDE);    // (defined in objects.js)
            break;
            
    }
    for (quarter in window.BasePlan) {
        for (course in window.BasePlan[quarter]) {
            if (course.indexOf('CORE') > -1) //CORE## found in schedule
                continue;

            var start = 1;
            for (; start < course.length; start++) {
                if (parseInt(course[start]) == course[start]) //You found the first number, start of course_number
                    break;
            }
            var branch = window.BasePlan[quarter][course]['branch'];
            var department = course.substring(0, start);
            var course_number = course.substring(start, course.length);
            var course_id = getCourseId(branch, department, course_number);

            window.CourseCatalogue[branch][course_id]['credit'] = 'YES';
            window.CourseCatalogue[branch][course_id]['quarter_taken'] = quarter;
        }
    }
    window.AllCourses = jQuery.extend(true,{},window.CourseCatalogue);
}

/*
 * This function is initially called for CSE students when the student's input from the view has changed.
 */
function computeNewSchedule() {
    // A SCHEDULE OBJECT IN THE SAME FORMAT AS THE DECLARATION MUST BE RETURNED HERE
    //              (obviously with new courses in each quarter)

    // RESET
    //DO SOMETHING HERE TO ADD C&I WHERE NEEDED WHEREVER CORES ARE OFFERED
    window.WorkingSchedule = jQuery.extend(true,{},window.BasePlan);    // (defined above)
    window.AllCourses = jQuery.extend(true,{},window.CourseCatalogue);    // (defined in all_courses.js)
    
    for(id in window.ModLog){
        for(course in window.ModLog[id]){
            var record = window.ModLog[id][course]
            // Execute the function
            window[record['function']].apply(window,record['parameters']);
        }
    }
    
    fixCI();
    return window.WorkingSchedule;
}
