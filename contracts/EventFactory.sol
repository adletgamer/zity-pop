// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Event.sol";

/**
 * @title EventFactory
 * @notice Factory contract para crear y gestionar eventos en ZITY.POP
 * @dev Crea instancias de contratos Event y mantiene un registro global
 */
contract EventFactory is Ownable, ReentrancyGuard {
    // ==================== STATE VARIABLES ====================
    
    /// @notice Array de todas las direcciones de eventos creados
    address[] public events;
    
    /// @notice Mapeo de organizador a sus eventos
    mapping(address => address[]) public organizerEvents;
    
    /// @notice Mapeo para verificar si una dirección es un evento válido
    mapping(address => bool) public isEvent;
    
    /// @notice Fee de la plataforma (en basis points, 250 = 2.5%)
    uint256 public platformFee = 250;
    
    /// @notice Wallet donde se acumulan los fees de la plataforma
    address public feeCollector;
    
    /// @notice Contador de eventos totales
    uint256 public totalEvents;
    
    // ==================== EVENTS ====================
    
    event EventCreated(
        address indexed eventAddress,
        address indexed organizer,
        string name,
        uint256 minGoal,
        uint256 optimalGoal,
        uint256 timestamp
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    
    // ==================== ERRORS ====================
    
    error InvalidFeeCollector();
    error InvalidPlatformFee();
    error InvalidEventData();
    error EventCreationFailed();
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(address _feeCollector) Ownable(msg.sender) {
        if (_feeCollector == address(0)) revert InvalidFeeCollector();
        feeCollector = _feeCollector;
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Crea un nuevo evento
     * @param _name Nombre del evento
     * @param _symbol Símbolo para los tickets NFT
     * @param _eventDate Timestamp de la fecha del evento
     * @param _location Ubicación del evento (puede ser hash IPFS)
     * @param _minGoal Meta mínima de financiamiento (en wei)
     * @param _optimalGoal Meta óptima de financiamiento (en wei)
     * @param _presaleEnd Timestamp del fin de la preventa
     * @return eventAddress Dirección del contrato del evento creado
     */
    function createEvent(
        string memory _name,
        string memory _symbol,
        uint256 _eventDate,
        string memory _location,
        uint256 _minGoal,
        uint256 _optimalGoal,
        uint256 _presaleEnd
    ) external nonReentrant returns (address eventAddress) {
        // Validaciones
        if (bytes(_name).length == 0 || bytes(_symbol).length == 0) {
            revert InvalidEventData();
        }
        if (_minGoal == 0 || _optimalGoal < _minGoal) {
            revert InvalidEventData();
        }
        if (_eventDate <= block.timestamp || _presaleEnd >= _eventDate) {
            revert InvalidEventData();
        }
        
        // Crear nuevo contrato Event
        Event newEvent = new Event(
            msg.sender,
            _name,
            _symbol,
            _eventDate,
            _location,
            _minGoal,
            _optimalGoal,
            _presaleEnd,
            platformFee,
            feeCollector
        );
        
        eventAddress = address(newEvent);
        
        // Registrar el evento
        events.push(eventAddress);
        organizerEvents[msg.sender].push(eventAddress);
        isEvent[eventAddress] = true;
        totalEvents++;
        
        emit EventCreated(
            eventAddress,
            msg.sender,
            _name,
            _minGoal,
            _optimalGoal,
            block.timestamp
        );
        
        return eventAddress;
    }
    
    /**
     * @notice Obtiene todos los eventos creados
     * @return Array con direcciones de todos los eventos
     */
    function getAllEvents() external view returns (address[] memory) {
        return events;
    }
    
    /**
     * @notice Obtiene eventos de un organizador específico
     * @param _organizer Dirección del organizador
     * @return Array con direcciones de eventos del organizador
     */
    function getOrganizerEvents(address _organizer) external view returns (address[] memory) {
        return organizerEvents[_organizer];
    }
    
    /**
     * @notice Obtiene información resumida de un evento
     * @param _eventAddress Dirección del contrato del evento
     */
    function getEventInfo(address _eventAddress) external view returns (
        address organizer,
        string memory name,
        uint256 eventDate,
        uint256 minGoal,
        uint256 optimalGoal,
        uint256 totalRaised,
        bool goalReached
    ) {
        if (!isEvent[_eventAddress]) revert InvalidEventData();
        
        Event eventContract = Event(_eventAddress);
        return (
            eventContract.organizer(),
            eventContract.name(),
            eventContract.eventDate(),
            eventContract.minGoal(),
            eventContract.optimalGoal(),
            eventContract.totalRaised(),
            eventContract.goalReached()
        );
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Actualiza el fee de la plataforma
     * @param _newFee Nuevo fee en basis points (max 10% = 1000)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        if (_newFee > 1000) revert InvalidPlatformFee(); // Max 10%
        
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        
        emit PlatformFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @notice Actualiza la wallet que recibe los fees
     * @param _newCollector Nueva dirección del fee collector
     */
    function updateFeeCollector(address _newCollector) external onlyOwner {
        if (_newCollector == address(0)) revert InvalidFeeCollector();
        
        address oldCollector = feeCollector;
        feeCollector = _newCollector;
        
        emit FeeCollectorUpdated(oldCollector, _newCollector);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Obtiene cantidad de eventos de un organizador
     * @param _organizer Dirección del organizador
     * @return Cantidad de eventos
     */
    function getOrganizerEventCount(address _organizer) external view returns (uint256) {
        return organizerEvents[_organizer].length;
    }
    
    /**
     * @notice Verifica si una dirección es un evento válido
     * @param _eventAddress Dirección a verificar
     * @return true si es un evento válido
     */
    function isValidEvent(address _eventAddress) external view returns (bool) {
        return isEvent[_eventAddress];
    }
}