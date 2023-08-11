import { Component, OnDestroy, OnInit, ViewChild, TemplateRef, Renderer2, EventEmitter, Self } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

import { CommonService, GetOptions } from 'src/app/utils/services/common.service';
import { App } from 'src/app/utils/interfaces/app';
import { AppService } from 'src/app/utils/services/app.service';
import { UserDetails } from 'src/app/utils/interfaces/userDetails';
import { environment } from 'src/environments/environment';
import { Breadcrumb } from '../../utils/interfaces/breadcrumb';
import { ColorPickerComponent } from 'src/app/utils/color-picker/color-picker.component';

@Component({
    selector: 'odp-app-manage',
    templateUrl: './app-manage.component.html',
    styleUrls: ['./app-manage.component.scss']
})
export class AppManageComponent implements OnInit, OnDestroy {

    activeTab: number;
    activeImageTab: number;
    appData: App;
    oldData: App;
    subscriptions: any = {};
    userConfig: GetOptions = {};
    groupConfig: GetOptions = {};
    appUsers: Array<UserDetails> = []; // For displaying list of users not present in selected App
    userList: Array<UserDetails> = []; // For displaying list of users present in selected App
    tempList: Array<any> = []; // placeholder
    groupList: Array<any> = [];
    selectedGroup: any;
    addUserModal: boolean;
    groupUserList: Array<UserDetails> = [];
    filterUserText: string;
    allUsers: boolean;
    showLazyLoader: boolean;
    selectedUsersForAddition: Array<any> = [];
    confirmModalState: any;
    confirmModalStateFlow: any;
    serviceStatus: any = {};
    partnerFlowStatus: any = {};
    identityDetails: any = {};
    infoStatus: string;
    afterStatus: string;
    cancelStatus: string;
    flowModalState: any = {};
    signedType: string;
    startServiceAttributes: any = {};
    proccessing: boolean;
    processing: boolean;
    cardActionDisabled: string;
    openDeleteModal: EventEmitter<any>;
    alertModal: {
        statusChange?: boolean;
        title: string;
        message: string;
        _id: string;
    };
    startFlowAttributes: any = {};
    @ViewChild('keyValModalTemplate', { static: false }) keyValModalTemplate: TemplateRef<HTMLElement>;
    @ViewChild('imageCropModal', { static: false }) imageCropModal: TemplateRef<HTMLElement>;
    @ViewChild('colorpicker') colorpicker: ColorPickerComponent;
    keyValModalTemplateRef: NgbModalRef;
    data: any;
    toggleColorPicker: boolean;
    versionConfig: any;
    retainDataHistory: boolean;
    defaultVersionValues: Array<any> = [null, '', '-1', '10', '25', '50', '100', '1 months', '3 months', '6 months', '1 years'];
    authType: string;
    isCalenderEnabled: boolean;
    timezones: Array<string>;
    breadcrumbPaths: Array<Breadcrumb> = [];
    constructor(private renderer: Renderer2,
        private commonService: CommonService,
        private appService: AppService,
        private router: Router,
        private ts: ToastrService,
        private route: ActivatedRoute) {
        this.activeTab = 1;
        this.activeImageTab = 1;
        this.appData = {};
        this.appData.appCenterStyle = {
            bannerColor: true,
            primaryColor: '44a8f1',
            theme: 'Light',
            textColor: 'FFFFFF'
        };
        this.appData.workflowConfig = {
            user: false,
            bot: false,
            group: false
        };
        this.appData.logo = {};
        this.addUserModal = false;
        this.allUsers = false;
        this.confirmModalState = {};
        this.confirmModalStateFlow = {};
        this.startServiceAttributes = {
            startCircle: 'cricleEnd',
            iconAnimate: 'iconInit',
            loadAnimate: 'unload',
            startCard: 'closed',
            startAction: 'infoHide',
            startGroup: 'buttonGroupHide',
            processing: 'infoHide',
            playIcon: 'playIcon',
            tickAction: 'hideProcessing',
            complete: 'infoHide',
            playLoader: 'loadingHide',
            stopLoader: 'loadingHide'
        };
        this.startFlowAttributes = {
            startCircle: 'cricleEnd',
            iconAnimate: 'iconInit',
            loadAnimate: 'unload',
            startCard: 'closed',
            startAction: 'infoHide',
            startGroup: 'buttonGroupHide',
            processing: 'infoHide',
            playIcon: 'playIcon',
            tickAction: 'hideProcessing',
            complete: 'infoHide',
            playLoader: 'loadingHide',
            stopLoader: 'loadingHide'
        };
        this.openDeleteModal = new EventEmitter();
        this.alertModal = {
            statusChange: false,
            title: '',
            message: '',
            _id: null
        };
        this.retainDataHistory = true;
        this.data = {};
        this.versionConfig = {};
        this.authType = this.commonService.userDetails.auth.authType;
        this.timezones = this.appService.getTimezones();
    }

    ngOnInit() {
        this.breadcrumbPaths.push({
            active: true,
            label: 'App Panel',
        });
        this.commonService.changeBreadcrumb(this.breadcrumbPaths)
        this.userConfig.count = -1;
        this.userConfig.noApp = true;
        this.userConfig.filter = {};
        this.userConfig.select = 'basicDetails.name username email _metadata.lastUpdated';
        this.groupConfig.count = -1;
        this.groupConfig.noApp = true;
        this.groupConfig.select = 'name users';
        this.renderer.listen('body', 'keyup', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                this.onCancel();
            }
        });
        this.infoStatus = 'hideInfo';
        this.getApp(this.commonService.app._id);
        this.getCalenderDataService();
        this.confirmModalState['allservice'] = true;
        this.confirmModalState['startAll'] = false;
        this.confirmModalStateFlow['allFlow'] = true;
        this.confirmModalStateFlow['startAll'] = false;

        this.afterStatus = 'beforeStart';
        this.proccessing = false;
    }
    onCancel() {
        if (this.addUserModal) {
            this.addUserModal = false;
            this.allUsers = false;
            this.selectedUsersForAddition = [];
        }
    }

    handleUpdate(data) {
        console.dir(data);
    }

    getApp(id: string) {
        this.showLazyLoader = true;
        this.commonService.get('user', '/data/app/' + id, { noApp: true }).subscribe(res => {
            this.showLazyLoader = false;
            this.tempList = res.users;
            this.appData = Object.assign(this.appData, res);
            this.oldData = this.appService.cloneObject(this.appData);
            this.getUserDetail();
            // this.getIdentityDetails();
            this.configureVersionSettings();
        }, err => {
            this.showLazyLoader = false;
        });
    }

    configureVersionSettings() {
        if (!this.appData.serviceVersionValidity) {
            this.appData.serviceVersionValidity = {
                validityType: 'count',
                validityValue: -1
            };
        }
        if (this.appData.serviceVersionValidity.validityValue === '0' || this.appData.serviceVersionValidity.validityValue === 0) {
            this.retainDataHistory = false;
        }
        this.versionConfig.type = this.appData.serviceVersionValidity.validityType;
        const validityValue = this.appData.serviceVersionValidity.validityValue.toString();
        if (+validityValue.split(' ')[0] > 0) {
            const defaultIndex = this.defaultVersionValues.findIndex(e => {
                if (e === validityValue) {
                    return e;
                }
            });
            if (!(defaultIndex > -1)) {
                this.versionConfig.value = 'custom';
                this.versionConfig.customValue = validityValue.split(' ')[0];
                this.versionConfig.customValueSuffix = validityValue.split(' ')[1];
                this.versionConfig.isCustomValue = true;
            } else {
                this.versionConfig.value = validityValue;
            }
        } else {
            this.versionConfig.value = validityValue;
        }
    }

    download(type?: string) {
        const ele: HTMLAnchorElement = document.createElement('a');
        ele.target = '_blank';
        let queryParams;
        if (type !== 'csr') {
            queryParams = `identity/${this.commonService.app._id}/fetch/download`;
        } else {
            queryParams = `identity/${this.commonService.app._id}/csr`;
        }
        if (environment.production) {
            ele.href = `${environment.url.sec}/${queryParams}`;
        } else {
            ele.href = `http://localhost/api/a/sec/${queryParams}`;
        }
        ele.click();
        ele.remove();
    }
    getUserDetail() {
        this.subscriptions['userDetails'] = this.commonService.get('user', `/data/app/${this.appData._id}`, { noApp: true, count: -1 })
            .subscribe(d => {
                if (d.length > 0) {
                    this.userList = d;
                }
            }, err => {
                this.commonService.errorToast(err, 'Unable to fetch users, please try again later');
            });
    }

    otherAppUsers() {
        this.addUserModal = true;
        const existingUserIds = [];
        this.userList.forEach(e => existingUserIds.push(e._id));
        const config = {
            count: -1,
            noApp: true,
            filter: {
                _id: { $nin: existingUserIds }
            }
        };
        this.subscriptions['userlist'] = this.commonService.get('user', `/${this.appData._id}/user`, config).subscribe((d: Array<UserDetails>) => {
            if (d.length > 0) {
                d.forEach(u => {
                    u.checked = false;
                });
                this.appUsers = d;
            }
        }, err => {
            this.commonService.errorToast(err, 'Unable to fetch users, please try again later');
        });
    }

    toggleUserSelection(user) {
        if (!user.checked) {
            this.selectUsr(user);
        } else {
            this.deSelectUsr(user);
        }
    }

    selectUsr(user) {
        user.checked = !user.checked;
        this.allUsers = this.appUsers.every(e => e.checked);
        const userIndex = this.selectedUsersForAddition.findIndex(e => e === user._id);
        if (userIndex >= 0) {
            return;
        } else {
            this.selectedUsersForAddition.push(user._id);
        }
    }

    deSelectUsr(user) {
        const idx = this.selectedUsersForAddition.findIndex(e => e === user._id);
        if (idx >= 0) {
            this.selectedUsersForAddition.splice(idx, 1);
        }
        user.checked = !user.checked;
        const i = this.appUsers.findIndex(e => e.checked === false);
        if (i > 0) {
            this.allUsers = false;
        }
    }

    selectAllUsrs() {
        if (this.allUsers) {
            this.appUsers.forEach(e => e['checked'] = true);
            this.selectedUsersForAddition = [];
            this.appUsers.forEach(e => this.selectedUsersForAddition.push(e._id));
        } else {
            this.appUsers.forEach(e => e['checked'] = false);
            this.selectedUsersForAddition = [];
        }
    }



    imageUpload(data: { message?: string, image?: string }, type: string) {
        if (type === 'logo') {
            this.appData.logo.full = data.image;
        } else {
            this.appData.logo.thumbnail = data.image;
        }
    }

    save() {
        if (!this.changesDone) {
            return;
        }
        if (this.appData && this.appData.logo) {
            if (!this.appData.logo.full) {
                this.appData.logo.full = null;
            }
            if (!this.appData.logo.thumbnail) {
                this.appData.logo.thumbnail = null;
            }
        }
        this.commonService.put('user', '/data/app/' + this.appData._id, this.appData).subscribe(res => {
            this.oldData = this.appService.cloneObject(this.appData);
            this.ts.success('App saved successfully');
            this.commonService.appUpdates.emit(this.appData);
            this.commonService.app = res;
        }, err => {
            this.commonService.errorToast(err);
        });
    }

    deleteApp() {
        this.alertModal.statusChange = false;
        this.alertModal.title = 'Delete App';
        this.alertModal.message = 'Are you sure you want to delete app <span class="text-delete font-weight-bold">' + this.appData._id
            + '</span>? This action will delete the entire app including all the data services within it. This action is undoable.';
        this.openDeleteModal.emit(this.alertModal);
    }

    closeDeleteModal(data) {
        if (data) {
            const url = '/admin/app/' + data._id;
            this.showLazyLoader = true;
            this.subscriptions['deleteApp'] = this.commonService.delete('user', url).subscribe(d => {
                this.showLazyLoader = false;
                this.ts.success('App deleted successfully');
                this.router.navigate(['/admin']);
            }, err => {
                this.showLazyLoader = false;
                this.commonService.errorToast(err, 'Unable to delete, please try again later');
            });
        }
    }

    get selectedColorStyle() {
        let retValue;
        if (this.appData.appCenterStyle.primaryColor.charAt(0) === '#') {
            retValue = this.appData.appCenterStyle.primaryColor;
        } else {
            retValue = '#' + this.appData.appCenterStyle.primaryColor;
        }
        return {
            background: retValue
        };
    }

    get changesDone() {
        if (JSON.stringify(this.appData) === JSON.stringify(this.oldData)) {
            return false;
        } else {
            return true;
        }
    }

    getLastActiveTime(time) {
        if (time) {
            const lastLoggedIn = new Date(time);
            return moment(lastLoggedIn).fromNow() === 'a day ago' ? '1 day ago' : moment(lastLoggedIn).fromNow();
        }
        return;
    }

    isThisUser(user) {
        if (user._id === this.commonService.userDetails._id) {
            return true;
        }
        return false;
    }

    getGroups(appId: string) {
        this.groupConfig.filter = {
            app: appId
        };
        this.commonService.get('user', `/${this.commonService.app._id}/group`, this.groupConfig).subscribe(res => {
            if (res.length > 0) {
                this.groupList = res;
                const index = this.groupList.findIndex(e => e.name === '#');
                if (index >= 0) {
                    this.groupList.splice(index, 1);
                }
                this.selectedGroup = this.groupList[0];
                this.getUsers();
            }
        }, err => {
            this.commonService.errorToast(err, 'Unable to fetch  groups, please try again later');
        });
    }

    getUsers() {
        if (this.selectedGroup && this.selectedGroup.length > 0) {
            this.userConfig.filter['_id'] = { $in: this.selectedGroup.users };
            this.subscriptions['getuserlist'] = this.commonService.get('user', `/${this.appData._id}/user`, this.userConfig).subscribe(d => {
                if (d.length > 0) {
                    this.groupUserList = d;
                }
            }, err => {
                this.commonService.errorToast(err, 'Unable to fetch users, please try again later');
            });
        }
    }

    addSelectedUsers() {
        if (this.selectedUsersForAddition.length > 0) {
            const payload = { users: this.selectedUsersForAddition };
            this.subscriptions['userAddition'] = this.commonService
                .put('user', `/data/app/${this.appData._id}/addUsers`, payload)
                .subscribe(() => {
                    this.onCancel();
                    this.getUserDetail();
                    this.ts.success(`User(s) successfully added to ${this.appData._id} App`);
                }, (err) => {
                    this.onCancel();
                    this.ts.warning(err.error.message);
                });
        } else {
            this.ts.warning('Please Select at least one user to proceed');
        }
    }

    ngOnDestroy() {
        Object.keys(this.subscriptions).forEach(e => {
            this.subscriptions[e].unsubscribe();
        });
    }

    isAppAdmin(user: UserDetails) {
        if (user.accessControl
            && user.accessControl.apps
            && user.accessControl.apps.length > 0
            && user.accessControl.apps.find(e => e._id === this.appData._id)) {
            return true;
        }
        return false;
    }

    startAllServices() {
        this.startServiceAttributes['playCircle'] = 'circleShrink';
        this.startServiceAttributes['playLoader'] = 'loadingShow';
        this.startServiceAttributes['startGroup'] = 'buttonGroupHide';
        this.startServiceAttributes['processing'] = 'playIcon';
        this.startServiceAttributes['playIcon'] = 'midStage';
        this.proccessing = true;
        this.cardActionDisabled = 'disabled';
        this.commonService.put('serviceManager', `/${this.appData._id}/service/utils/startAll`, { app: this.commonService.app._id }).subscribe(res => {
            this.startAllServices['processing'] = 'playIconHide';
            if (res) {
                this.startAllServices['processing'] = 'playIconHide';
                this.startAllServices['processing'] = 'playIconHide';
                this.startServiceAttributes['playIcon'] = 'playIconHide';
                this.startServiceAttributes['playLoader'] = 'hideProcessing';
                this.startServiceAttributes['tickAction'] = 'playIcon';
                this.proccessing = false;
                this.startServiceAttributes['complete'] = 'showProcessing';
                this.cardActionDisabled = 'enable';
                this.getManagementDetails();
                this.startAllServices['processing'] = 'playIconHide';
            }
        });
    }
    stopAllServices() {
        this.startServiceAttributes['stopCircle'] = 'stopCircleShrink';
        this.startServiceAttributes['stopLoader'] = 'loadingShow';
        this.startServiceAttributes['stopGroup'] = 'buttonGroupHide';
        this.startServiceAttributes['processing'] = 'playIcon';
        this.proccessing = true;
        this.cardActionDisabled = 'disabled';
        this.commonService.put('serviceManager', `/${this.appData._id}/service/utils/stopAll`, { app: this.commonService.app._id }).subscribe(res => {
            if (res) {
                this.startAllServices['processing'] = 'playIconHide';
                this.startAllServices['processing'] = 'playIconHide';
                this.startServiceAttributes['stopIcon'] = 'playIconHide';
                this.startServiceAttributes['stopCircle'] = 'hideProcessing';
                this.startServiceAttributes['stopTickAction'] = 'playIcon';
                this.startServiceAttributes['stopLoader'] = 'loadingHide';
                this.proccessing = false;
                this.startServiceAttributes['complete'] = 'showProcessing';
                this.cardActionDisabled = 'enable';
                this.getManagementDetails();
            }
        });
    }

    toggleStopCard(name: string) {

        if (this.startServiceAttributes['playLoader'] === 'loadingShow' || this.startServiceAttributes['stopLoader'] === 'loadingShow') {
            return false;
        }
        if (!this.serviceStatus.Active && name === 'stopAll') {
            return false;
        }
        Object.keys(this.confirmModalState).forEach(key => {
            this.confirmModalState[key] = false;
        });
        this.startServiceAttributes['stopLoader'] = 'loadingHide';
        if (!this.confirmModalState['startAll']) {
            this.startServiceAttributes = {
                stopCard: 'expand',
                stopanimateItems: 'centerLocate',
                stopCircle: 'stopCircleExpand',
                stopGroup: 'buttonGroupShow',
                stopLoader: 'loadingHide',
                playLoader: 'loadingHide'
            };

        } else if (this.confirmModalState['allservice']) {
            this.startServiceAttributes = {
                stopCard: 'collapse',
                stopanimateItems: 'initLocate',
                stopCircle: 'stopCircleExpand',
                stopGroup: 'buttonGroupHide',
                stopLoader: 'loadingHide',
                playLoader: 'loadingHide'
            };
        }


    }
    toggleCard(name: string) {
        if (this.startServiceAttributes['playLoader'] === 'loadingShow' || this.startServiceAttributes['stopLoader'] === 'loadingShow') {
            return false;
        }
        if (this.startServiceAttributes['tickAction'] === 'playIcon' && name === 'startAll') {
            return false;
        }
        if (!this.serviceStatus.Undeployed && name === 'startAll') {
            return false;
        }
        Object.keys(this.confirmModalState).forEach(key => {
            this.confirmModalState[key] = false;
        });
        this.startServiceAttributes['playIcon'] = 'playIcon';
        this.startServiceAttributes['playLoader'] = 'loadingHide';
        this.confirmModalState[name] = true;
        if (this.confirmModalState['startAll']) {
            this.startServiceAttributes = {
                startCard: 'expand',
                animateItems: 'centerLocate',
                playCircle: 'circleExpand',
                startGroup: 'buttonGroupShow',
                playLoader: 'loadingHide',
                stopLoader: 'loadingHide',
            };

        } else if (this.confirmModalState['allservice']) {
            this.startServiceAttributes = {
                startCard: 'collapse',
                animateItems: 'initLocate',
                startGroup: 'buttonGroupHide',
                playLoader: 'loadingHide',
                stopLoader: 'loadingHide',
            };
        }
    }

    getManagementDetails() {
        this.commonService.get('serviceManager', `/${this.commonService.app._id}/service/utils/status/count`, { filter: { app: this.commonService.app._id } }).subscribe(res => {
            this.serviceStatus = res;
        }, (err) => {
            this.ts.warning(err.error.message);
        });

    }
    getIdentityDetails() {
        this.commonService.get('sec', `/identity/${this.commonService.app._id}`).subscribe(res => {
            if (res) {
                this.identityDetails = res.message;
                if (res.message.info) {
                    if (this.identityDetails.info['subject']['OU'] === this.identityDetails.info['issuer']['OU']) {
                        this.signedType = 'self';
                    } else {
                        this.signedType = this.identityDetails.info['issuer']['OU'];
                    }
                }
            }
        }, err => {
            this.commonService.errorToast(err);
        });
    }

    patchVersionValue(reset?: boolean) {
        let value;
        if (reset) {
            if (this.versionConfig.type === 'count') {
                this.versionConfig = {
                    type: 'count',
                    value: '-1',
                    customValue: 10
                };
            } else {
                this.versionConfig = {
                    type: 'time',
                    value: '',
                    customValue: 10,
                    customValueSuffix: 'days'
                };
            }
        }
        this.versionConfig.isCustomValue = false;
        if (this.versionConfig.value === 'custom') {
            this.versionConfig.isCustomValue = true;
            value = this.versionConfig.customValue >= 0 ? this.versionConfig.customValue.toString() : null;
            if (value && this.versionConfig.type === 'time') {
                value += ' ' + this.versionConfig.customValueSuffix;
            }
        } else {
            value = this.versionConfig.value;
        }
        this.appData.serviceVersionValidity.validityType = this.versionConfig.type;
        this.appData.serviceVersionValidity.validityValue = value;
    }

    onVersionChange(value) {
        if (value) {
            this.patchVersionValue(true);
        } else {
            this.retainDataHistory = false;
            this.appData.serviceVersionValidity.validityType = 'count';
            this.appData.serviceVersionValidity.validityValue = 0;
        }
    }

    get validityValidator() {
        if (this.versionConfig.customValue > 0 && this.versionConfig.customValue !== null) {
            return true;
        } else if (this.versionConfig.customValue === 0) {
            return false;
        }
    }

    openPropertiesModal(data?: any) {
        if (data) {
            this.data = data;
            this.data.isEdit = true;
        }
        this.keyValModalTemplateRef = this.commonService
            .modal(this.keyValModalTemplate, { centered: true, windowClass: 'key-value-modal' });
        this.keyValModalTemplateRef.result.then(close => {
            if (close) {
                let temp = this.appData.headers;
                if (!temp) {
                    temp = [];
                }
                const tempIndex = temp.findIndex(e => e.key === this.data.key);
                if (tempIndex > -1) {
                    temp.splice(tempIndex, 1);
                }
                temp.push({
                    key: this.data.key,
                    value: this.data.value,
                    header: this.convertHeader(this.data.key)
                });
                this.appData.headers = temp;
            }
            this.data = {};
        }, dismiss => {
            this.data = {};
        });
    }

    removeProperty(key: string) {
        const temp = this.appData.headers;
        const tempIndex = temp.findIndex(e => e.key === key);
        if (tempIndex > -1) {
            temp.splice(tempIndex, 1);
        }
        this.appData.headers = temp;
    }

    convertHeader(key: string) {
        if (key) {
            return 'Data-Stack-A-' + key.split(' ')
                .filter(e => e)
                .map(e => e.charAt(0).toUpperCase() + e.substr(1, e.length))
                .join('-');
        }
        return null;
    }

    get keyValueList() {
        return this.appData.headers || [];
    }
    toggleCardFlow(name: string) {
        Object.keys(this.confirmModalStateFlow).forEach(key => {
            this.confirmModalStateFlow[key] = false;
        });
        this.startFlowAttributes['playIcon'] = 'playIcon';
        this.startFlowAttributes['playLoader'] = 'loadingHide';
        this.confirmModalStateFlow[name] = true;
        if (this.confirmModalStateFlow['startAll']) {
            this.startFlowAttributes = {
                startCard: 'expand',
                animateItems: 'centerLocate',
                playCircle: 'circleExpand',
                startGroup: 'buttonGroupShow',
                playLoader: 'loadingHide',
                stopLoader: 'loadingHide',
            };

        } else if (this.confirmModalStateFlow['allFlow']) {
            this.startFlowAttributes = {
                startCard: 'collapse',
                animateItems: 'initLocate',
                startGroup: 'buttonGroupHide',
                playLoader: 'loadingHide',
                stopLoader: 'loadingHide',
            };
        }
    }
    toggleStopCardFlow(name: string) {
        Object.keys(this.confirmModalStateFlow).forEach(key => {
            this.confirmModalStateFlow[key] = false;
        });
        this.startFlowAttributes['stopLoader'] = 'loadingHide';
        if (!this.confirmModalStateFlow['startAll']) {
            this.startFlowAttributes = {
                stopCard: 'expand',
                stopanimateItems: 'centerLocate',
                stopCircle: 'stopCircleExpand',
                stopGroup: 'buttonGroupShow',
                stopLoader: 'loadingHide',
                playLoader: 'loadingHide'
            };

        } else if (this.confirmModalStateFlow['allflow']) {
            this.startFlowAttributes = {
                stopCard: 'collapse',
                stopanimateItems: 'initLocate',
                stopCircle: 'stopCircleExpand',
                stopGroup: 'buttonGroupHide',
                stopLoader: 'loadingHide',
                playLoader: 'loadingHide'
            };
        }
    }
    getFlowCount() {
        this.showLazyLoader = true;
        const option: GetOptions = {
            filter: {
                app: this.commonService.app._id,
            }
        };
        this.commonService.get('partnerManager', `/${this.commonService.app._id}/flow/utils/status/count`).subscribe(res => {
            this.partnerFlowStatus = res;
            this.showLazyLoader = false;

        }, err => {
            this.showLazyLoader = false;
            this.commonService.errorToast(err);
        });
    }



    startAllFlows() {
        this.startFlowAttributes['playCircle'] = 'circleShrink';
        this.startFlowAttributes['playLoader'] = 'loadingShow';
        this.startFlowAttributes['startGroup'] = 'buttonGroupHide';
        this.startFlowAttributes['processing'] = 'playIcon';
        this.startFlowAttributes['playIcon'] = 'midStage';
        this.proccessing = true;
        this.cardActionDisabled = 'disabled';
        this.commonService.put('partnerManager', `/${this.commonService.app._id}/flow/utils/startAll`, { app: this.commonService.app._id }).subscribe(res => {

            if (res) {
                this.startFlowAttributes['playIcon'] = 'playIconHide';
                this.startFlowAttributes['playLoader'] = 'hideProcessing';
                this.startFlowAttributes['tickAction'] = 'playIcon';
                this.proccessing = false;
                this.startFlowAttributes['complete'] = 'showProcessing';
                this.cardActionDisabled = 'enable';
                this.getFlowCount();

            }
        }, (err => {
            this.commonService.errorToast(err);

        }));
    }
    stopAllFlows() {
        this.startFlowAttributes['stopCircle'] = 'stopCircleShrink';
        this.startFlowAttributes['stopLoader'] = 'loadingShow';
        this.startFlowAttributes['stopGroup'] = 'buttonGroupHide';
        this.startFlowAttributes['processing'] = 'playIcon';
        this.proccessing = true;
        this.cardActionDisabled = 'disabled';
        this.commonService.put('partnerManager', `/${this.commonService.app._id}/flow/utils/stopAll`).subscribe(res => {
            if (res) {
                this.startFlowAttributes['stopIcon'] = 'playIconHide';
                this.startFlowAttributes['stopCircle'] = 'hideProcessing';
                this.startFlowAttributes['stopTickAction'] = 'playIcon';
                this.startFlowAttributes['stopLoader'] = 'loadingHide';
                this.proccessing = false;
                this.startFlowAttributes['complete'] = 'showProcessing';
                this.cardActionDisabled = 'enable';
                this.getFlowCount();
            }
        }, (err => {
            this.commonService.errorToast(err);

        }));
    }
    goTopartnerPage() {
        this.router.navigate(['/app', this.commonService.app._id, 'pm']);
    }

    ipInvalid(ipAddress) {
        if (ipAddress) {
            try {
                const segments = ipAddress.split('.');
                const lastSeg = segments[3];
                const cidr = lastSeg.split('/');
                let flag = false;
                segments[3] = cidr[0];
                if (segments.length !== 4) {
                    flag = true;
                }
                for (let i = 0; i < 4; i++) {
                    if (!segments[i] || segments[i].match(/[^0-9]+/g)) {
                        flag = true;
                    }
                    if (segments[i] !== '*' && (parseInt(segments[i], 10) < 0 || parseInt(segments[i], 10) > 255)) {
                        flag = true;
                    }
                }
                if (cidr.length > 1 && parseInt(cidr[1], 10) > 32) {
                    flag = true;
                }
                return flag;
            } catch (e) {
                return true;
            }
        }
        return false;
    }

    ipRequired(ipAddress) {
        if (!ipAddress || !ipAddress.trim()) {
            return true;
        }
        return false;
    }

    addIP() {
        const list = this.ipList;
        list.push('');
    }

    removeIP(index) {
        const list = this.ipList;
        list.splice(index, 1);
    }

    changeIP(ipAddress, index) {
        const list = this.ipList;
        list.splice(index, 1, ipAddress);
    }

    ChangeCalendarSettings(value) {
        const url = value ? '/calendar/enable' : '/calendar/disable';
        const data = {
            app: this.commonService.app._id
        }
        this.commonService.put('serviceManager', url, data).subscribe(res => {
            this.ts.success(value ? 'Calendar enabled' : 'Calendar disabled')
            if (!environment.production) {
                console.log(res);
            }
        }, err => {
            this.commonService.errorToast(err, 'Unable to enable the Calendar dataservice');
        });

    }

    getCalenderDataService() {
        const options = {
            filter: {
                app: `${this.commonService.app._id}`,
                type: 'internal',
                status: 'Active'
            }
        };
        this.commonService.get('serviceManager', `/${this.commonService.app._id}/service`, options).subscribe(res => {
            if (res.length) {
                this.isCalenderEnabled = true;
            }
        }, err => {
            this.commonService.errorToast(err);
        });
    }

    changeTab() {
        this.activeTab = 3;
        this.getFlowCount();
        this.getManagementDetails();
    }

    reset() {
        this.appData.appCenterStyle = {
            bannerColor: true,
            primaryColor: '44a8f1',
            theme: 'Light',
            textColor: 'FFFFFF'
        };
        this.colorpicker.selected=null;
    }

    set enabledTrustedIP(val) {
        if (!this.appData.agentTrustedIP) {
            this.appData.agentTrustedIP = {
                list: [],
                enabled: false
            };
        }
        this.appData.agentTrustedIP.enabled = val;
    }

    get enabledTrustedIP() {
        if (this.appData.agentTrustedIP) {
            return this.appData.agentTrustedIP.enabled;
        }
        return false;
    }

    get ipList() {
        if (this.appData.agentTrustedIP && this.appData.agentTrustedIP.list) {
            return this.appData.agentTrustedIP.list;
        }
        return [];
    }

    get isInvalid() {
        return (this.ipList.map(this.ipInvalid).filter(e => e).length > 0) || (this.ipList.map(this.ipRequired).filter(e => e).length > 0);
    }
}

